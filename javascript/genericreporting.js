(function($){

	angular
	.module('GenericReportingApp', [])
	.factory('api', ['$http', function($http){
		var API_URL = '/dev/reporting';
		
		var _getStore = function(){
			var defaultStore = {
				savedReports: []
			};
			return window.localStorage.genericReporting ? JSON.parse(window.localStorage.genericReporting) : defaultStore;
		};
		var _setStore = function(store){
			window.localStorage.genericReporting = JSON.stringify(store);
		};
		
		return {
			getDataObjects: function(){
				return $http.get(API_URL+'/getDataObjects');
			},
			report: function(params){
				return $http.get(API_URL+'/report', { params: params });
			},
			save: function(report){
				var store = _getStore();
				
				var newID = store.savedReports.length;
				store.savedReports[newID] = report;
				
				_setStore(store);
				return newID;
			},
			get: function(id){
				var store = _getStore();
				return store.savedReports[id];
			}
		}
	}])
	.factory('reportRunner', ['api', function(api){
		var listeners = [];
		return {
			run: function(request){
				if(!request.dataObject) return;
				var httpRequestParams = {
					dataObject: request.dataObject.className,
					'fields[]': request.selectedFields, // have to do this, angular is silly
					filters:    request.filters,
					sortBy:     request.sortBy,
					sortDesc:   request.sortDesc,
					limit:      request.limit,
					offset:     request.offset
				};
				api.report(httpRequestParams).then(function(apiResp){
					var runResult = {
						httpRequestParams: httpRequestParams,
						request: request,
						response: apiResp.data
					};
					for(var i in listeners){
						var listener = listeners[i];
						listener(runResult);
					}
				});
			},
			listen: function(listener){
				listeners.push(listener);
			}
		}
	}])
	.controller('Request', ['$scope', 'api', 'reportRunner', function($scope, api, reportRunner){
		var _isFiltersInit = false;
		
		$scope.report = {
			name: null,         // TODO
			dataObject: null,
			selectedFields: [],
			filters: {},
			sort: null
		};

		window.req = $scope;
		
		$scope.dataObject = null;
		$scope.fields = null;
		$scope.filters = null;

		$scope.sortDesc = 1;
		$scope.limit = 20;
		$scope.offset = 0;
		
		$scope.dataObjects = null;

		$scope.defaultDataObject = 'Page';

		// TODO: use summary_fields as default columns
		
		api.getDataObjects().then(function(apiResp){
			console.log('getDataObjects: ', apiResp);
			$scope.dataObjects = apiResp.data;
			// default
			var firstDataObject = null;
			for(var i in $scope.dataObjects){
				var d = $scope.dataObjects[i];
				if(!firstDataObject) firstDataObject = d;
				if(d.className == $scope.defaultDataObject){
					$scope.dataObject = d;
					break;
				}
			}
			// otherwise select first
			if(!$scope.dataObject && firstDataObject){
				$scope.dataObject = firstDataObject;
			}
		});
		
		$scope.updateFiltersBuilder = function(){
			console.log('updateFiltersBuilder', $scope.dataObject);
			if(!$scope.dataObject) return;
			var filters = [];
			for(var i in $scope.dataObject.fields){
				var field = $scope.dataObject.fields[i];
				var filter = {
					id: field.definedOn+'.'+field.name
				};
				if(field.type == 'Int') filter.type = 'integer';
				if(field.type == 'Varchar(255)') filter.type = 'string'; // TODO: other varchars
				if(field.type == 'SS_Datetime') filter.type = 'datetime';
				if(field.type == 'Text') filter.type = 'string';
				if(field.type == 'ForeignKey') filter.type = 'integer'; // TODO: use select type
				if(field.type == 'Boolean'){
					// TODO: other bools
					filter.type = 'boolean';
					filter.input = 'radio';
					filter.values = {
						1: 'Yes',
						0: 'No'
					}
				}
				if(!filter.type) filter.type = 'string';
				filters.push(filter);
			}
			
			console.log('filtersBuilder filters set to:', filters);
			if(!_isFiltersInit){
				$('.filters-builder').queryBuilder({ filters: filters });
				_isFiltersInit = true;
			}
			$('.filters-builder').queryBuilder('setFilters', true, filters);
			_onFiltersChanged();
		};
		
		// external to angular, have to pull in changes manually
		var _onFiltersChanged = function(){
			if(!_isFiltersInit) return;
			
			// store rules
			var rules = $('.filters-builder').queryBuilder('getRules');
			$scope.filters = rules;
			
			// debug
			$('.filters-debug').text(JSON.stringify(rules, null, ' '));
		};
		
		
		$scope.runReport = function(){
			reportRunner.run($scope.report);
		};
		
		$scope.buildFilters = function(node){
			if(node.field){
				return {
					field:    node.field,
					operator: node.operator,
					value:    node.value
				}
			}else{
				// group
				var r = {
					condition: node.condition,
					rules:     []
				};
				for(var i in node.rules){
					r.rules.push($scope.buildFilters(node.rules[i]));
				}
				return r;
			}
		};
		
		$scope.updateReport = function(){
			if($scope.dataObject){
				$scope.report.dataObject = $scope.dataObject;
			}	
			$scope.report.selectedFields = [];
			if($scope.fields){
				for(var i in $scope.fields){
					$scope.report.selectedFields.push($scope.fields[i].name);
				}
			}
			if($scope.filters){
				$scope.report.filters = $scope.buildFilters($scope.filters);
			}
			$scope.report.sortBy = null;
			if($scope.sortBy){
				$scope.report.sortBy = $scope.sortBy.name;
			}
			$scope.report.sortDesc = $scope.sortDesc;
			$scope.report.limit = $scope.limit;
			$scope.report.offset = $scope.offset;
		};
		
		
		$scope.$watchGroup(['dataObject', 'fields', 'filters', 'sortBy', 'sortDesc', 'limit'], function(){
			$scope.updateReport();
			$scope.runReport();
		});
		
		$scope.$watch('dataObject', $scope.updateFiltersBuilder);
		
		$('.filters-builder').change(function(){
			$scope.$apply(function(){
				_onFiltersChanged();
			});
		});
		
	}])
	.controller('Response', ['$scope', 'reportRunner', function($scope, reportRunner){
		reportRunner.listen(function(data){
			$scope.request = data.request;
			console.log($scope.request.sortBy, $scope.request.sortDesc);
			$scope.response = data.response;
		});

		$scope.smartPaginationNumUiElements = 7;

		$scope.updateHeaderColumns = function(){
			if(!$scope.response) return;
			if($scope.response.rows.length == 0) return;
			// look up DataObject fields by first response row
			var r = [];
			var respRowKeys = Object.keys($scope.response.rows[0]);
			for(var i in respRowKeys){
				var respFieldName = respRowKeys[i];
				var respField = null;
				for(var x in $scope.request.dataObject.fields){
					var reqField = $scope.request.dataObject.fields[x];
					if(reqField.name == respFieldName){
						respField = reqField;
						break;
					}
				}
				if(respField){
					r.push(respField);
				}else{
					// should never happen...
					console.warn('Server returned column we dont know about: '+respFieldName);
					r.push({
						name: respFieldName,
						humanReadableName: respFieldName
					});
				}
			}
			$scope.headerColumns = r; 
		};

		$scope.updatePagination = function(){
			if(!$scope.response) return;

			$scope.firstRowIndex = $scope.response.offset;
			$scope.lastRowIndex = $scope.response.offset + $scope.response.limit - 1;
			if($scope.lastRowIndex > $scope.response.totalNumRows - 1){
				$scope.lastRowIndex = $scope.response.totalNumRows - 1;
			}

			$scope.firstRowNumber = $scope.firstRowIndex + 1;
			$scope.lastRowNumber = $scope.lastRowIndex + 1;

			var pages = [];
			var pageNumber = 1;
			var currentPageIndex = null;
			for(var i = 0; i < $scope.response.totalNumRows; i += $scope.response.limit){
				pages.push({
					offset: i,
					number: pageNumber,
					isCurrentPage: i >= $scope.firstRowIndex && i <= $scope.lastRowIndex
				});
				pageNumber++;
			}
			$scope.pages = pages;

			$scope.hasPrevious = $scope.firstRowIndex > 0;
			$scope.hasNext = $scope.lastRowIndex < $scope.response.totalNumRows - 1;

			$scope.updateSmartPagination();
		};

		$scope.updateSmartPagination = function(){
			// show only pages around context (start, current, end)
			var currentPageIndex = 0;
			for(var i in $scope.pages){
				var p = $scope.pages[i];
				if(p.isCurrentPage){
					currentPageIndex = parseInt(i, 10); // why do we have to parse?
					break;
				}
			}

			// divide into 4 blocks, start, middle(x2), end
			var blockLength = Math.floor($scope.smartPaginationNumUiElements / 4); // roughly
			var twiceBlockLength = Math.floor($scope.smartPaginationNumUiElements / 2); // roughly
			
			var r = [];
			var spacer = function(){
				// have to create new object so angular can handle it
				return {
					spacer: true
				}
			};

			if($scope.pages.length <= $scope.smartPaginationNumUiElements){
				// trivial: can fit them all
				r = $scope.pages;

			}else{
				// tricky...
				var nearStart = currentPageIndex <= blockLength;
				var nearEnd = currentPageIndex >= $scope.pages.length - blockLength;
				if(nearStart || nearEnd){
					// context is around start: two blocks at start, then [..], then end block.
					// - or - 
					// context is around end: start block, then [..], then two blocks at end
					for(var i = 0; i < twiceBlockLength; i++){
						r.push($scope.pages[i]);
					}
					r.push(spacer());
					var remaining = $scope.smartPaginationNumUiElements - r.length;
					for(var i = $scope.pages.length - remaining; i < $scope.pages.length; i++){
						r.push($scope.pages[i]);
					}

				}else{
					// context is in the middle:
					// start block, then [..], then two middle blocks, then [..], then end block
					var itemsAroundMiddle = (blockLength * 2) + 1 + 2;
					var itemsAroundSides = $scope.smartPaginationNumUiElements - itemsAroundMiddle;
					var itemsAtStart = Math.ceil(itemsAroundSides / 2);

					for(var i = 0; i < itemsAtStart; i++){
						r.push($scope.pages[i]);
					}
					r.push(spacer());
					for(var i = currentPageIndex - blockLength; i <= currentPageIndex + blockLength; i++){
						r.push($scope.pages[i]);
					}
					r.push(spacer());
					var remaining = $scope.smartPaginationNumUiElements - r.length;
					for(var i = $scope.pages.length - remaining; i < $scope.pages.length; i++){
						r.push($scope.pages[i]);
					}
				}
			}
			$scope.smartPages = r;
		};

		$scope.goToOffset = function(offset){
			var updatedRequest = $scope.request;
			updatedRequest.offset = offset;
			reportRunner.run(updatedRequest);
		};

		$scope.goToNextPage = function(){
			if(!$scope.hasNext) return;
			var passedNext = false;
			for(var i in $scope.pages){
				var p = $scope.pages[i];
				if(passedNext){
					$scope.goToOffset(p.offset);
					return;
				}
				if(p.isCurrentPage){
					passedNext = true;
				}
			}
		};

		$scope.goToPreviousPage = function(){
			if(!$scope.hasPrevious) return;
			var previous = null;
			for(var i in $scope.pages){
				var p = $scope.pages[i];
				if(p.isCurrentPage){
					$scope.goToOffset(previous.offset);
					return;
				}
				previous = p;
			}
		};

		$scope.sortBy = function(field, desc){
			console.log('sortBy', field, desc);
			var updatedRequest = $scope.request;
			updatedRequest.sortBy = field.name;
			updatedRequest.sortDesc = desc ? 1 : 0;
			reportRunner.run(updatedRequest);
		};

		$scope.$watch('response', $scope.updateHeaderColumns);
		$scope.$watch('response', $scope.updatePagination);
		
	}])
	.controller('Persistance', ['$scope', 'api', function($scope, api){
		$scope.saved = [];
		
		$scope.toSave = {
			name: 'New Report',
			report: null
		};
		
		$scope.save = function(){
			api.save();
		};
		
	}]);

})(jQuery);