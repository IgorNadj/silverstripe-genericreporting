(function () {
	angular
	.module('GenericReportingApp', [])
	.factory('api', ['$http', function($http){
		var API_URL = '/dev/reporting';
		
		return {
			getDataObjects: function(){
				return $http.get(API_URL+'/getDataObjects');
			},
			report: function(params){
				return $http.get(API_URL+'/report', { params: params });
			}
		}
	}])
	.factory('report', ['api', function(api){
		var listeners = [];
		return {
			run: function(requestRaw){
				var request = {
					dataObject: requestRaw.dataObject,
					'fields[]': requestRaw.fields, // have to do this, angular is silly
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
	.controller('Request', ['$scope', 'api', 'report', function($scope, api, report){
		
		$scope.dataObject = null;
		$scope.fields = null;
		$scope.filters = null;
		
		$scope.dataObjects = null;
		$scope.isFiltersInit = false;
		
		api.getDataObjects().then(function(apiResp){
			console.log('getDataObjects: ', apiResp);
			$scope.dataObjects = apiResp.data;
		});
		
		$scope.updateFilters = function(){
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
			$scope.isFiltersInit = true;
			$scope.onFiltersChanged();
		};
		
		// external to angular, have to pull in changes manually
		$scope.onFiltersChanged = function(){
			if(!$scope.isFiltersInit) return;
			
			// store rules
			var rules = $('.filters-builder').queryBuilder('getRules');
			$scope.filters = rules;
			
			// debug
			$('.filters-debug').text(JSON.stringify(rules, null, ' '));
		};
		
		
		$scope.runReport = function(){
			var request = $scope.buildRequest();
			report.run(request);
		};
		
		$scope.buildRequest = function(){
			var r = {
				dataObject: null,
				fields: [],
				filters: {}
			};
			
			if($scope.dataObject){
				r.dataObject = $scope.dataObject.className;
			}	
			if($scope.fields){
				for(var i in $scope.fields){
					r.fields.push($scope.fields[i].name);
				}
			}
			if($scope.filters){
				r.filters = $scope.buildFilters($scope.filters);
			}
			
			return r;
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
		
		
		$scope.$watch('dataObject', $scope.updateFilters);
		
		$scope.$watch('dataObject', $scope.runReport);
		$scope.$watch('fields', $scope.runReport);
		$scope.$watch('filters', $scope.runReport);
		
		$('.filters-builder').change(function(){
			$scope.$apply(function(){
				$scope.onFiltersChanged();
			});
		});
		
	}])
	.controller('Response', ['$scope', 'report', function($scope, report){
		report.listen(function(data){
			console.log('reportResponse data: ', data);
			$scope.request = data.request;
			$scope.response = data.response;
		});
		
	}]);
})();