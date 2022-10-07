import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import { toWidget, toWidgetEditable, viewToModelPositionOutsideModelElement } from '@ckeditor/ckeditor5-widget/src/utils';
import Widget from '@ckeditor/ckeditor5-widget/src/widget';
import Command from '@ckeditor/ckeditor5-core/src/command';

import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';

import redflag from '../../public/icon_redflag.svg';
import yellowflag from '../../public/icon_yellowflag.svg';
import info from '../../public/icon_info.svg';
import choosingwisely from '../../public/icon_choosingwisely.svg';
import valuebasedcare from '../../public/icon_valuebasedcare.svg';
import healthequity from '../../public/icon_healthequity.svg';
import resourcelimited from '../../public/icon_resourcelimited.svg';
import digitalhealth from '../../public/icon_digitalhealth.svg';
import integrativemedicine from '../../public/icon_integrativemedicine.svg';
import reference from '../../public/icon_reference.svg';

const CAN_EDIT_ACTIONS = false;

export default class ActionPlugin extends Plugin {
    static get requires() {
        return [ ActionEditing, ActionUI ];
    }
}

function createRandomId() {
    return Math.round(Math.random() * Number.MAX_SAFE_INTEGER).toString();
}

const actionList = [
    // This gets passed to the execute() function at the top
    { type: 'redflag', tooltip: 'Red Flag', background: '#ffcfd0', color: '#cd0000', icon: redflag},
    { type: 'yellowflag', tooltip: 'Yellow Flag', background: '#fffbdc', color: '#f5e44c', icon: yellowflag},
    { type: 'info', tooltip: 'Info', background: '#f9fafc', color: '#083d5a', icon: info},
    { type: 'choosingwisely', tooltip: 'Choosing Wisely', background: '#fff8e1', color: '#046caa', icon: choosingwisely},
    { type: 'valuebasedcare', tooltip: 'Value-Based Care', background: '#e8e8fe', color: '#10157d', icon: valuebasedcare},
    { type: 'healthequity', tooltip: 'Health Equity', background: '#ecd6ff', color: '#6000ac', icon: healthequity},
    { type: 'resourcelimited', tooltip: 'Resource Limited', background: '#ffd7d7', color: '#b23333', icon: resourcelimited},
    { type: 'digitalhealth', tooltip: 'Digital Health', background: '#e6f6ff', color: '#12618d', icon: digitalhealth},
    { type: 'integrativemedicine', tooltip: 'Integrative Medicine', background: '#dcfff7', color: '#00634c', icon: integrativemedicine},
    { type: 'reference', tooltip: 'Reference', background: '#f5f5f5', color: '#000000', icon: reference},
];

const typeToTooltip = Object.fromEntries(actionList.map(action => [action.type, action.tooltip]));
console.log(typeToTooltip);

/**
 * An action (aka 'icon') has a type (e.g. redflag), and some html content.
 * We have THREE representations:
 *
 *   (1) 'save'/'load' representation   (the 'data view').  This should be backward compatible with how existing actions are saved by tinymce.
 *   (2) Editting representation ('view').   This can be anything.
 *   (3) Internal representation ('model').  This can be anything.
 *
 * The data format for these is:
 *
 *   (1) 'save'/'load' representation:
 *       <action id="6203058534499425" class="actionNonEditable" title="Red Flag" type="redflag" contenteditable="false">
 *         <actioncontent class="actionNonEditable" type="redflag" contenteditable="false">
 *           <div>Hello!</div>
 *         </actioncontent>
 *       </action>
 *
 *   (2) Editting representation ('view'):
 *       <action id="6203058534499425" type="redflag">
 *         <actioncontent class="actionNonEditable" type="redflag" contenteditable="false">
 *           <div>Hello!</div>
 *         </actioncontent>
 *       </action>
 *
 *   (3) Internal representation ('model'):
 *       <action id="6203058534499425" type="redflag">
 *         <actioncontent type="redflag">
 *           <div>Hello!</div>
 *         </actioncontent>
 *       </action>
 */
class ActionCommand extends Command {
    /** This gets called when you insert an action (flag icon)
     *
     *  Creates: (3) Internal representation ('model'):
     *
     *       <action id="6203058534499425" type="redflag">
     *         (selection)
     *       </action>
     *
     * @param {{type:string, tooltip: string, color: string}}
     */
    execute( { type, tooltip, color } ) {
        console.log('excute!', type, tooltip, color);
        const editor = this.editor;
        const selection = editor.model.document.selection;

        editor.model.change( modelWriter => {
            console.log('selection is', selection, Object.fromEntries(selection.getAttributes()));

            const frag = editor.model.getSelectedContent( selection );

            const p = modelWriter.createElement( 'paragraph');
            const actionContent = modelWriter.createElement( 'actionContent', { type });
            const action = modelWriter.createElement( 'action', {
                id: createRandomId(),
                type
            });


            // insert the selected text into p inside actionContent
            modelWriter.append( frag, p );
            modelWriter.append( p, actionContent);
            modelWriter.append( actionContent, action );
            editor.model.insertContent( action );

            // Put the selection on the inserted element.
            modelWriter.setSelection( p, 'in' );
        } );
    }

    refresh() {
        const model = this.editor.model;
        const selection = model.document.selection;

        const isAllowed = model.schema.checkChild( selection.focus.parent, 'action' );

        this.isEnabled = isAllowed;
    }
}

class ActionUI extends Plugin {
    init() {
        const editor = this.editor;

        // The "action" dropdown must be registered among the UI components of the editor
        // to be displayed in the toolbar.
        actionList.map(action =>
            editor.ui.componentFactory.add( `action-${action.type}`, locale => {
                const view = new ButtonView( locale );
                view.set( {
                    label: action.tooltip,
                    icon: action.icon,
                    tooltip: true,
                    withText: false
                } );

                view.extendTemplate( {
                    attributes: {
                        class: 'ck-reset_all-excluded actionToolbarButton',
                        style: `background: ${action.background}; padding: 3px; box-sizing: content-box; margin: 0;`
                    }
                } );

                // Disable the action button when the command is disabled.
                const command = editor.commands.get( 'action' );
                view.bind( 'isEnabled' ).to( command );

                // Execute the command when the button is clicked (executed).
                this.listenTo( view, 'execute', evt => {
                    console.log('Clicked on action: ', action);
                    editor.execute( 'action', action);
                    editor.editing.view.focus();
                } );

                return view;
            } )
        );
    }
}

class ActionEditing extends Plugin {
    static get requires() {
        return [ Widget ];
    }

    init() {
        console.log( 'ActionEditing#init() got called' );

        this._defineSchema();
        this._defineConverters();

        this.editor.commands.add( 'action', new ActionCommand( this.editor ) );

        this.editor.editing.mapper.on(
            'viewToModelPosition',
            viewToModelPositionOutsideModelElement( this.editor.model, viewElement => viewElement.hasClass( 'action' ) )
        );
        this.editor.config.define( 'actionConfig', { actions: actionList } );
    }

    _defineSchema() {
        const schema = this.editor.model.schema;

        schema.register( 'action', {
            // Allow wherever text is allowed:
            allowWhere: '$text',

            // The action will act as an inline node:
            //isInline: true,

            // The inline widget is self-contained so it cannot be split by the caret and it can be selected:
            isObject: true,

            // A selection that starts inside should not end outside.
            // Pressing Backspace or Delete should not delete the area. Pressing Enter should not split the area.
            isLimit: true,

            // <action id="" type="redflag"><actioncontent.../></action>
            allowAttributes: [ 'id', 'type' ]
        } );

        schema.register( 'actionContent', {
            // Allowed only inside an action:
            allowIn: 'action',

            // <actioncontent type="redflag">content</actioncontent>
            allowAttributes: [ 'type' ],

            // Allow content which is allowed in the root (e.g. paragraphs)
            allowChildren: '$text',
            allowContentOf: '$root',
        } );
    }

    _defineConverters() {
        const conversion = this.editor.conversion;

        /*
         *   Convert from (1) 'save'/'load' representation to (3) internal representation ('model').
         *   i.e. from:
         *
         *       <action id="6203058534499425" class="actionNonEditable" title="Red Flag" type="redflag" contenteditable="false">
         *         <actioncontent class="actionNonEditable" type="redflag" contenteditable="false">
         *           <div>Hello!</div>
         *         </actioncontent>
         *       </action>
         *
         *   to:
         *       <action id="6203058534499425" type="redflag">
         *         <p type="redflag">
         *           <div>Hello!</div>
         *         </p>
         *       </action>
         */
        conversion.for( 'upcast' ).add( dispatcher => {
            dispatcher.on( 'element:action', ( evt, data, conversionApi ) => {
                // Get all the necessary items from the conversion API object.
                const {
                    consumable,
                    writer: modelWriter,
                    safeInsert,
                    convertChildren,
                    updateConversionResult
                } = conversionApi;

                // Get view item from data object.
                const { viewItem } = data;

                // Define elements consumables.
                const wrapper = { name: true };
                const innerWrapper = { name: true };
                console.log('action was pasted in!  viewItem is', viewItem);
                const id = viewItem.getAttribute('id') || createRandomId();
                const type = viewItem.getAttribute('type') || 'redflag';

                // Tests if the view element can be consumed.
                if ( !consumable.test( viewItem, wrapper ) ) {
                    console.warn(`action(${type}#${id})  is not consumable!`);
                    return;
                }

                // Create model element.
                const actionContent = modelWriter.createElement( 'actionContent', { type });
                const action = modelWriter.createElement( 'action', { id, type }, [ actionContent ] );

                // Consume the main outer wrapper element.
                consumable.consume( viewItem, wrapper );

                // Insert element on a current cursor location.
                if ( !safeInsert( action, data.modelCursor ) ) {
                    console.warn('It is not safe to insert the action..!?');
                    return;
                }
                const innerPosition = data.modelCursor.getShiftedBy( action.offsetSize );
                if ( !safeInsert( actionContent, innerPosition ) ) {
                    console.warn('It is not safe to insert the actioncontent..!?');
                    return;
                }


                for (const childItem of viewItem.getChildren()) {
                    // Should be only one child (actioncontent), but try to be robust against bad input and look for the first actioncontent.
                    if ( !consumable.test( childItem, innerWrapper ) ) {
                        console.warn(`actions(${type}#${id}) child was not consumable!?`);
                        continue;
                    }


                    // Check if the element is an actioncontent - which it should be
                    if ( !childItem.is( 'element', 'actioncontent' ) ) {
                        console.warn(`actions(${type}#${id}) child was not actioncontent!?`);
                        continue;
                    }

                    // Consume the inner wrapper element.
                    consumable.consume( childItem, innerWrapper );

                    // Handle children conversion inside inner wrapper element.
                    convertChildren( childItem, actionContent );
                    console.log('successfully added actioncontent');
                }

                console.log('successfully added action');

                // Necessary function call to help setting model range and cursor
                // for some specific cases when elements being split.
                updateConversionResult( action, data );
            } );
        });


/*        conversion.for( 'upcast' ).elementToElement( {
            view: {
                name: 'action2',
            },
            model: ( viewElement, { writer: modelWriter } ) => {
                const id = viewElement?.getAttribute('id') || createRandomId();
                const type = viewElement?.getAttribute('type') || 'redflag';
                const e = modelWriter.createElement( 'action', { id, type } );
                return e;
            }
        } );

        conversion.for( 'upcast' ).elementToElement( {
            view: {
                name: 'actioncontent',
            },
            model: ( viewElement, { writer: modelWriter } ) => {
                const type = viewElement?.getAttribute('type');
                const e = modelWriter.createElement( 'actionContent', { type } );
                console.log('upcast actioncontent! from', type);
                return e;
            }
        } );*/

        conversion.for( 'editingDowncast' ).elementToElement( {
            model: 'action',
            view: ( modelItem, { writer: viewWriter } ) => {
                console.log('editingDowncast action', modelItem);
                const type = modelItem.getAttribute( 'type' );
                const id = modelItem.getAttribute( 'id' );
                const title = typeToTooltip[type];

                const widgetElement = viewWriter.createContainerElement( 'action', {
                    type, title, class: 'actionNonEditable open', id
                });

                if (CAN_EDIT_ACTIONS) {
                // Enable widget handling on a action element inside the editing view.
                return toWidget( widgetElement, viewWriter );
                } else {
                    return widgetElement;
                }
            }
        } );

        conversion.for( 'editingDowncast' ).elementToElement( {
            model: 'actionContent',
            view: ( modelItem, { writer: viewWriter } ) => {
                console.log('editingDowncast actionContent', modelItem);
                const type = modelItem.getAttribute( 'type' );

                if (CAN_EDIT_ACTIONS) {
                    const widgetElement = viewWriter.createEditableElement( 'actioncontent', {
                        type, class: 'actionNonEditable'
                    } );

                    // Enable widget handling on a action element inside the editing view.
                    return toWidgetEditable( widgetElement, viewWriter );
                } else {
                    const widgetElement = viewWriter.createContainerElement( 'actioncontent', {
                        type, class: 'actionNonEditable'
                    } );

                    // Enable widget handling on a action element inside the editing view.
                    return widgetElement;
                }
            }
        } );

        // When saving the document
        conversion.for( 'dataDowncast' ).elementToElement( {
            model: 'action',
            view: ( modelItem, { writer: viewWriter } ) => {
                console.log('dataDowncast', modelItem);
                const type = modelItem.getAttribute( 'type' );
                const id = modelItem.getAttribute( 'id' );
                const title = typeToTooltip[type];

                return viewWriter.createContainerElement( 'action', {
                    type, title, class: 'actionNonEditable', id
                });
            }
        } );

        // When saving the document
        conversion.for( 'dataDowncast' ).elementToElement( {
            model: 'actionContent',
            view: ( modelItem, { writer: viewWriter } ) => {
                const type = modelItem.getAttribute( 'type' );

                return viewWriter.createContainerElement( 'actioncontent', {
                    type, class: 'actionNonEditable'
                } );
            },
        } );
    }
}
