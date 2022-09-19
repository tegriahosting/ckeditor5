import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import { toWidget, viewToModelPositionOutsideModelElement } from '@ckeditor/ckeditor5-widget/src/utils';
import Widget from '@ckeditor/ckeditor5-widget/src/widget';
import Command from '@ckeditor/ckeditor5-core/src/command';

import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import Collection from '@ckeditor/ckeditor5-utils/src/collection';
import Model from '@ckeditor/ckeditor5-ui/src/model';

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
 *         <div>Hello!</div>
 *       </action>
 *
 *   (3) Internal representation ('model'):
 *       <action id="6203058534499425" type="redflag">
 *         <div>Hello!</div>
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

        editor.model.change( writer => {
            console.log('selection is', selection, Object.fromEntries(selection.getAttributes()));

            const frag = editor.model.getSelectedContent( selection );

            // Create a <action> element with the "type" attribute (and all the selection attributes)...
            const action = writer.createElement( 'action', {
                id: createRandomId(),
                type
            } );

            // ... and insert it into the document.
            writer.append( frag, action );
            editor.model.insertContent( action );


            // Put the selection on the inserted element.
            writer.setSelection( action, 'on' );
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
        const t = editor.t;
        const actions = editor.config.get( 'actionConfig.actions' );

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
            isInline: true,

            // The inline widget is self-contained so it cannot be split by the caret and it can be selected:
            isObject: true,

            // <action type="" id="" title="Red Flag" type="redflag">content</action>
            allowAttributes: [ 'id', 'class', 'title', 'type' ]
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
         *         <div>Hello!</div>
         *       </action>
         */

        conversion.for( 'upcast' ).elementToElement( {
            view: {
                name: 'action',
            },
            model: ( viewElement, { writer: modelWriter } ) => {

                console.log('I am here!');
                const id = viewElement?.getAttribute('id');
                const type = viewElement?.getAttribute('type');
                //const content = viewElement?.getChild(0)?.getChild(0    )?.data;
                // console.log('name, id, type is', text);

                const e = modelWriter.createElement( 'action', { id, type } );
                return e;
            }
        } );

        conversion.for( 'editingDowncast' ).elementToElement( {
            model: 'action',
            view: ( modelItem, { writer: viewWriter } ) => {
                const widgetElement = createActionView( modelItem, viewWriter, true );

                // Enable widget handling on a action element inside the editing view.
                return toWidget( widgetElement, viewWriter );
            }
        } );

        // When saving the document
        conversion.for( 'dataDowncast' ).elementToElement( {
            model: 'action',
            view: ( modelItem, { writer: viewWriter } ) => createActionView( modelItem, viewWriter, false )
        } );

        // Helper method for both downcast converters.
        function createActionView( modelItem, viewWriter, isEditing ) {
            const type = modelItem.getAttribute( 'type' );
            const color = modelItem.getAttribute( 'color' );
            const id = modelItem.getAttribute( 'id' );
            const title = typeToTooltip[type];

            let child;
            if (!isEditing) {
                child = [
                    viewWriter.createContainerElement( 'actioncontent', {
                        type, color, title, class: 'actionNonEditable', id
                    } )
                ];
            }

            const actionView = viewWriter.createContainerElement( 'action', {
                type, color, title: title, class: 'actionNonEditable', id
            }, child );

            return actionView;
        }
    }
}
