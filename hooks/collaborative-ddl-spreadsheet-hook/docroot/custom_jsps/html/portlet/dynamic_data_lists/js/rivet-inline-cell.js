AUI.add(
    'rivet-inline-cell',
    function(A) {
        
        var InlineCellEditor = A.Component.create({
            
            /**
            * Static property provides a string to identify the class.
            *
            * @property NAME
            * @type String
            * @static
            */
            NAME: 'inlineCellEditor',
            
            /**
            * Static property used to define which component it extends.
            *
            * @property EXTENDS
            * @type Object
            * @static
            */
            EXTENDS: A.Base,
            
            prototype: {
                ELEMENT_TEMPLATE: '<input type="text">', // avoids error, this value is expected by BaseCellEditor
                initializer: function(config) {
                    var instance = this;
                },
                
                /**
                * Edits the selected cell, called externally from the data table definition
                *
                *
                */
                editInlineCell: function(tableData) {
                    var tbl = tableData;
                    tbl.activeCell.addClass('inline-cell-editor');
                    if (!tbl.activeCell.one('input')) {
                        this.showInlineCellField(tbl);
                        this.bindInlineCell(tbl);
                    }
                },
                
                /**
                * Attaches events
                *
                *
                */
                bindInlineCell: function(tableData) {
                    var tbl = tableData;
                    var instance = this;
                    // ends editing cell
                    tbl.activeCell.one('input').on('blur', function() {
                        var val = this.get('value');
                        this.remove();
                        tbl.activeCell.set('text', val);
                        try {
                            tbl.record.set(tbl.column.key, this.get('value')); // update model
                        } catch(e) {}
                    });
                    // editing cell value
                    tbl.activeCell.one('input').on('keyup', function(e) {
                        e.stopPropagation();
                        if (this.get('value') !== instance.get('value')) {
                            instance.set('value', this.get('value'));
                            var data = tbl.table.getCellData(tbl.activeCell);
                            data.value = this.get('value');
                            tbl.table.fire('cellValueUpdated', data);
                        }
                    });
                    
                    // datatable enables the user switch cells with arrows so lets avoid 
                    // while its on inline cell editing
                    var stopCellSelection = function() {
                        tbl.activeCell.one('input').once('key', function(e) {
                            e.stopPropagation();
                            stopCellSelection();
                        }, 'down:enter,37,38,39,40');
                    };
                    stopCellSelection();
                },
                
                /**
                * Shows cell edit field, it focus field and 
                * user can type inside
                *
                */
                showInlineCellField: function(tableData) {
                    var tbl = tableData;
                    var value = tbl.activeCell.get('text');
                    tbl.activeCell.append(this.ELEMENT_TEMPLATE);
                    var field = tbl.activeCell.one('input');
                    field.removeClass('hidden');
                    field.set('value', value);
                    field.focus();
                }
            },
            ATTRS: {
                
                /**
                * 
                *
                * @attribute editable
                * @default false
                * @type Boolean
                */
                editable: {
                    value: true,
                    validator: A.Lang.isBoolean
                }
            }
        });
        
        Liferay.RivetInlineCellEditor = InlineCellEditor;

        },
        '1.0',
        {
            requires: ['aui-arraysort', 'aui-datatable', 'datatable-sort', 'json', 'liferay-portlet-url', 'liferay-util-window', 'liferay-portlet-dynamic-data-lists']
        })
