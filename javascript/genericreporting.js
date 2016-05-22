(function () {
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
			run: function(requestRaw){
				var request = {
					dataObject: requestRaw.dataObjectClassName,
					'fields[]': requestRaw.selectedFields, // have to do this, angular is silly
					filters: requestRaw.filters,
					sortBy: requestRaw.sortBy,
					sortDesc: requestRaw.sortDesc,
					limit: requestRaw.limit,
					offset: requestRaw.offset
				};
				api.report(request).then(function(apiResp){
					var runResult = {
						request: requestRaw,
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
			dataObjectClassName: null,
			selectedFields: [],
			filters: {},
			sort: null
		};
		
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
			if(!$scope.dataObject) return;
			var filters = [];
			for(var i in $scope.dataObject.fields){
				var field = $scope.dataObject.fields[i];
				var filter = {
					id: field.name
				};
				if(field.type == 'Int') filter.type = 'integer';
				if(field.type == 'Varchar(255)') filter.type = 'string'; // TODO: other varchars
				if(field.type == 'SS_Datetime') filter.type = 'datetime';
				if(field.type == 'Text') filter.type = 'string';
				if(field.type == 'Boolean(1)'){
					// TODO: other bools
					filter.type = 'integer';
					filter.input = 'radio';
					filter.values = {
						1: 'Yes',
						0: 'No'
					}
				}
				filters.push(filter);
			}
			
			$('.filters-builder').queryBuilder({
				filters: filters
			});
			_isFiltersInit = true;
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
				$scope.report.dataObjectClassName = $scope.dataObject.className;
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
			console.log('updateReport', $scope.report);
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
			console.log('reportResponse data: ', data);
			$scope.request = data.request;
			$scope.response = data.response;
		});

		$scope.updatePagination = function(){
			if(!$scope.response) return;
			console.log('updatePagination', $scope.response);

			$scope.firstRowIndex = $scope.response.offset;
			$scope.lastRowIndex = $scope.response.offset + $scope.response.limit - 1;
			if($scope.lastRowIndex > $scope.response.totalNumRows - 1){
				$scope.lastRowIndex = $scope.response.totalNumRows - 1;
			}

			$scope.firstRowNumber = $scope.firstRowIndex + 1;
			$scope.lastRowNumber = $scope.lastRowIndex + 1;

			var pages = [];
			var pageNumber = 1;
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
					console.log('next page: ', p);
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
					console.log('prev page: ', previous);
					$scope.goToOffset(previous.offset);
					return;
				}
				previous = p;
			}
		};

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
})();