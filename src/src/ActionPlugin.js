import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import { toWidget, viewToModelPositionOutsideModelElement } from '@ckeditor/ckeditor5-widget/src/utils';
import Widget from '@ckeditor/ckeditor5-widget/src/widget';
import Command from '@ckeditor/ckeditor5-core/src/command';

import { addListToDropdown, createDropdown } from '@ckeditor/ckeditor5-ui/src/dropdown/utils';
import Collection from '@ckeditor/ckeditor5-utils/src/collection';
import Model from '@ckeditor/ckeditor5-ui/src/model';

export default class ActionPlugin extends Plugin {
    static get requires() {
        return [ ActionEditing, ActionUI ];
    }
}

function createRandomId() {
    return Math.round(Math.random() * Number.MAX_SAFE_INTEGER).toString();
}

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
    // This gets called when you insert an action (flag icon)
    execute( { type, tooltip, color } ) {
        console.log('excute!', type, tooltip, color);
        const editor = this.editor;
        const selection = editor.model.document.selection;

        editor.model.change( writer => {
            console.log('selection is', selection, Object.fromEntries(selection.getAttributes()));

            const frag = editor.model.getSelectedContent( selection );
            console.log('items is', frag);

            // Create a <action> element with the "type" attribute (and all the selection attributes)...
            const action = writer.createElement( 'action', {
                id: createRandomId(),
                type
            } );

            // ... and insert it into the document.
            // action.insertContent(writer.cloneElement(items, true));
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
        editor.ui.componentFactory.add( 'action', locale => {
            const dropdownView = createDropdown( locale );

            // Populate the list in the dropdown with items.
            addListToDropdown( dropdownView, getDropdownItemsDefinitions( actions ) );

            dropdownView.buttonView.set( {
                // The t() function helps localize the editor. All strings enclosed in t() can be
                // translated and change when the language of the editor changes.
                label: t( 'Flags' ),
                tooltip: true,
                withText: true
            } );

            // Disable the action button when the command is disabled.
            const command = editor.commands.get( 'action' );
            dropdownView.bind( 'isEnabled' ).to( command );

            // Execute the command when the dropdown item is clicked (executed).
            this.listenTo( dropdownView, 'execute', evt => {
                console.log('got', evt.source.commandParam);
                editor.execute( 'action', evt.source.commandParam);
                editor.editing.view.focus();
            } );

            return dropdownView;
        } );
    }
}

function getDropdownItemsDefinitions( actions ) {
    const itemDefinitions = new Collection();

    for ( const action of actions ) {
        const definition = {
            type: 'button',
            model: new Model( {
                commandParam: action,
                label: action.tooltip,
                withText: true
            } )
        };

        // Add the item definition to the collection.
        itemDefinitions.add( definition );
    }

    return itemDefinitions;
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
        this.editor.config.define( 'actionConfig', {
            actions: [
                // This gets passed to the execute() function at the top
                { type: 'redflag', tooltip: 'Red Flag', color: '#cd0000' },
                { type: 'yellowflag', tooltip: 'Yellow Flag', color: '#f5e44c' },
                { type: 'info', tooltip: 'Info', color: '#083d5a' },
                { type: 'choosingwisely', tooltip: 'Choosing Wisely', color: '#046caa' },
                { type: 'valuebasedcare', tooltip: 'Value-Based Care', color: '#10157d' },
                { type: 'healthequity', tooltip: 'Health Equity', color: '#6000ac' },
                { type: 'resourcelimited', tooltip: 'Resource Limited', color: '#b23333' },
                { type: 'digitalhealth', tooltip: 'Digital Health', color: '#12618d' },
                { type: 'integrativemedicine', tooltip: 'Integrative Medicine', color: '#00634c' },
                { type: 'reference', tooltip: 'Reference', color: '#000000' },
            ]
        } );
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
            const tooltip = modelItem.getAttribute( 'tooltip' );

            const actionView = viewWriter.createContainerElement( 'action', {
                type, color, tooltip, class: 'actionNonEditable', id: createRandomId()
            } );


            // Insert the action type (as a text).
            const innerText = viewWriter.createText( '{' + type + '}' );

            if (!isEditing) {
                const actionContentView = viewWriter.createContainerElement( 'actioncontent', {
                    type, color, tooltip, class: 'actionNonEditable', id: createRandomId()
                } );
                viewWriter.insert( viewWriter.createPositionAt( actionView, 0 ), actionContentView );
                viewWriter.insert( viewWriter.createPositionAt( actionContentView, 0 ), innerText );
            } else {
                viewWriter.insert( viewWriter.createPositionAt( actionView, 0 ), innerText );
            }

            return actionView;
        }
    }
}
