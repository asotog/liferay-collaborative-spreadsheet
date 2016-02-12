AUI.add(
    'rivet-collaboration-spreadsheet',
    function(A) {
        var RivetCollaborationSpreadSheet = A.Component.create(
            {
                ATTRS: {
                    
                },
                
                CSS_PREFIX: 'table',

                EXTENDS: Liferay.RivetSpreadSheet,
                
                NAME: A.DataTable.Base.NAME,
                
                prototype: {
                    initializer: function() {
                        
                    }
                }
            });
            Liferay.RivetCollaborationSpreadSheet = RivetCollaborationSpreadSheet;
        },
    	'',
    	{
    		requires: ['rivet-spreadsheet-datatable', 'aui-arraysort', 'aui-datatable', 'datatable-sort', 'json', 'liferay-portlet-url', 'liferay-util-window']
    	})
