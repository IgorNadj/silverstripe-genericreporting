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
					filters: requestRaw.filters
				};
				api.report(request).then(function(apiResp){
					var runResult = {
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
			dataObjectClassName: null,
			selectedFields: [],
			filters: {}
		};
		
		$scope.dataObject = null;
		$scope.fields = null;
		$scope.filters = null;
		
		$scope.dataObjects = null;
		
		api.getDataObjects().then(function(apiResp){
			console.log('getDataObjects: ', apiResp);
			$scope.dataObjects = apiResp.data;
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
			if($scope.fields){
				for(var i in $scope.fields){
					$scope.report.selectedFields.push($scope.fields[i].name);
				}
			}
			if($scope.filters){
				$scope.report.filters = $scope.buildFilters($scope.filters);
			}
			console.log('updateReport', $scope.report);
		};
		
		
		$scope.$watchGroup(['dataObject', 'fields', 'filters'], function(){
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