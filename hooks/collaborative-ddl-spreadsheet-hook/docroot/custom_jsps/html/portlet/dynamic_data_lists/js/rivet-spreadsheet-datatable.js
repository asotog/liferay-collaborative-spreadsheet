AUI.add(
    'rivet-spreadsheet-datatable',
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
                            console.log(this.get('value'));
                            instance.set('value', this.get('value'));
                        }
                    });
                    
                    // datatable lets the user switch cells with arrows so lets avoid 
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
                * Shows cell edit field
                *
                *
                */
                showInlineCellField: function(tableData) {
                    var tbl = tableData;
                    tbl.activeCell.append(this.ELEMENT_TEMPLATE);
                    var field = tbl.activeCell.one('input');
                    field.removeClass('hidden');
                    field.set('value', tbl.record.get(tbl.column.key));
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
        
        var HIGHLIGHTED_CELL = '.cell-highlight.current-user.table-cell';

        var RivetSpreadSheet = A.Component.create({
            ATTRS: {
                highlightColor: {
                    value: '#3FC51B'
                }
            },
            
            CSS_PREFIX: 'table',
            
            EXTENDS: Liferay.SpreadSheet,
            
            NAME: A.DataTable.Base.NAME,
            
            prototype: {
                initializer: function() {
                    this.bindSpreadSheet();
                },
                
                /*
                * Attaches all the events to the spreadsheet table
                * 
                *
                */
                bindSpreadSheet: function() {
                    var instance = this;
                    instance.after('highlightColorChange', A.bind(instance._highlightColorChanged, instance));
                    
                    instance.delegate(instance.get('editEvent'), function(e) {
                        var activeCell = instance.get('activeCell'),
                        alignNode = event.alignNode || activeCell,
                        column = instance.getColumn(alignNode),
                        record = instance.getRecord(alignNode),
                        editor = instance.getEditor(record, column);
                        if (!(editor instanceof Liferay.RivetInlineCellEditor)) {
                            return;
                        }
                        e.stopPropagation();
                        editor.editInlineCell({
                            activeCell: activeCell,
                            record: record,
                            column: column
                        });
                    }, '.' + instance.CLASS_NAMES_CELL_EDITOR_SUPPORT.cell, this);
                    
                    // highlight
                    instance.delegate('click', function(e) {
                        var cellList = instance.get('boundingBox').all(HIGHLIGHTED_CELL);
                        cellList.setStyle('border-color', '');
                        cellList.removeClass('cell-highlight').removeClass('current-user');
                        var cell = e.currentTarget;
                        instance._updateHighlightCellColor(cell);
                        instance._publishCellHighlight(cell);
                    }, '.' + instance.CLASS_NAMES_CELL_EDITOR_SUPPORT.cell, this);
                },
                
                /*
                * Triggers event with the give selected cell data
                * 
                *
                */
                _publishCellHighlight: function(cell) {
                    var col = cell.getDOMNode().className.match(/(^|\s)(table\-col\-[^\s]*)/)[0];
                    var record = cell.ancestor('tr').getAttribute('data-yui3-record');
                    this.fire('cellHighlighted', {col: col, record: record});
                },
                
                /*
                * Listens the highlight color value changes
                * 
                *
                */
                _highlightColorChanged: function() {
                    if (this.get('boundingBox').one(HIGHLIGHTED_CELL)) {
                        this._updateHighlightCellColor(this.get('boundingBox').one(HIGHLIGHTED_CELL));
                    }
                },
                
                /*
                * Updates cell color
                * 
                *
                */
                _updateHighlightCellColor: function(cell) {
                    cell.addClass('cell-highlight').addClass('current-user');
                    cell.setStyle('border-color', this.get('highlightColor'));
                },
                
                /*
                * Updates cell color by give color parameter and puts title over the 
                * cell
                * 
                *
                */
                _updateTitledHighlightCellByClasses: function(data) {
                    if (data.cell) {
                        this.get('boundingBox').all('.' + data.refClass + ' .cell-highlight-title').remove();
                        var cells = this.get('boundingBox').all('.' + data.refClass);
                        cells.setStyle('border-color', '');
                        cells.removeClass(data.refClass).removeClass('cell-highlight');
                        data.cell.addClass(data.refClass).addClass('cell-highlight');
                        data.cell.setStyle('border-color', data.color);
                        data.cell.append('<span style="background-color: ' + data.color + 
                            ';" class="cell-highlight-title">' + data.title + '</span>')
                    }
                }
            }
        });
            
        RivetSpreadSheet.EXTENDS.TYPE_EDITOR = {
            'checkbox': A.CheckboxCellEditor,
            'ddm-date': A.DateCellEditor,
            'ddm-decimal': A.TextCellEditor,
            'ddm-integer': A.TextCellEditor,
            'ddm-number': A.TextCellEditor,
            'radio': A.RadioCellEditor,
            'select': A.DropDownCellEditor,
            'text': Liferay.RivetInlineCellEditor,
            'textarea': A.TextAreaCellEditor
        };

        Liferay.RivetSpreadSheet = RivetSpreadSheet;

        },
        '1.0',
        {
            requires: ['aui-arraysort', 'aui-datatable', 'datatable-sort', 'json', 'liferay-portlet-url', 'liferay-util-window', 'liferay-portlet-dynamic-data-lists']
        })
