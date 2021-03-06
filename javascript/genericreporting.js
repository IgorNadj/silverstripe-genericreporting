(function($){

	angular
	.module('GenericReportingApp', ['ngRoute'])
	.config(function($routeProvider, $locationProvider){
		$routeProvider
			.when('/admin/reporting/saved', {
				templateUrl : '/genericreporting/templates/angular/list.html'
			})
			.when('/admin/reporting', {
				templateUrl : '/genericreporting/templates/angular/view.html'
			})
			.when('/admin/reporting/view/:id', {
				templateUrl : '/genericreporting/templates/angular/view.html'
			});
		$locationProvider.html5Mode(true);
	})
	.run(function($location, $rootScope){
	})
	.controller('NavTabs', ['$scope', '$location', function($scope, $location){
		$scope.activeTab = 'report';
		$scope.goToReport = function(){
			$location.path('/admin/reporting');
		};
		$scope.goToSaved = function(){
			$location.path('/admin/reporting/saved');
		};
		$scope.$on('$locationChangeSuccess', function(e, newLocation){
			if(newLocation.indexOf('/admin/reporting/view/') !== -1){
				$scope.activeTab = 'report';
			}else if(newLocation.indexOf('/admin/reporting/saved') !== -1){
				$scope.activeTab = 'saved';
			}else{
				$scope.activeTab = 'report';
			}
		});
	}])
	.factory('nav', ['$rootScope', function($rootScope){
		return {
			setLocationString: function(str){
				$rootScope.$broadcast('locationChanged', str);
			}
		};
	}])
	.controller('Breadcrumbs', ['$scope', function($scope){
		$scope.nested = false;
		$scope.title = '';
		$scope.$on('locationChanged', function(e, newLocationStr){
			$scope.title = newLocationStr;
			if(newLocationStr){
				$scope.nested = true;
			}else{
				$scope.nested = false;
			}
		});
	}])
	.controller('ListController', ['$scope', '$location', '$timeout', 'api', 'nav', function($scope, $location, $timeout, api, nav){
		$scope.reports = [];
		$scope.editingID = 0;
		api.listAll().then(function(data){
			$scope.reports = data.data;
		});
		$scope.loadReport = function(id){
			$location.path('/admin/reporting/view/'+id);
		};
		$scope.startEditing = function(id){
			console.log('startEditing', id);
			$scope.editingID = id;
		};
		nav.setLocationString('Saved Reports');
	}])
	.controller('ViewController', ['$scope', 'nav', function($scope, nav){
		nav.setLocationString('');
	}])
	.factory('api', ['$http', '$q', function($http, $q){
		var API_URL = '/dev/reporting';
		
		// Defer getDataObjects API call to give us implicit caching
		var deferredGetDataObjects = $q.defer();
		$http.get(API_URL+'/getDataObjects').then(
			function(apiResp){
				deferredGetDataObjects.resolve(apiResp);
			},
			function(err){
				deferredGetDataObjects.reject(err);
			}
		);

		return {
			getDataObjects: function(){
				return deferredGetDataObjects.promise;
			},
			report: function(params){
				return $http.get(API_URL+'/report', { params: params });
			},
			save: function(params){
				// Apparently angular needs serialised post data + set headers...
				// see: http://stackoverflow.com/questions/11442632/how-can-i-post-data-as-form-data-instead-of-a-request-payload
				// BUT, our param 'filters' needs to be JSON to allow nesting, so we have to do that manually...
				var newParams = {};
				var paramKeys = Object.keys(params);
				for(var i in paramKeys){
					var key = paramKeys[i];
					if(key == 'filters'){
						newParams[key] = JSON.stringify(params[key]);	
					}else{
						newParams[key] = params[key];
					}
				}
				var serialisedParams = $.param(newParams);
				
				return $http({
					method: 'POST',
					url: API_URL+'/save',
					data: serialisedParams,
					headers: {'Content-Type': 'application/x-www-form-urlencoded'}
				});
			},
			listAll: function(){
				return $http.get(API_URL+'/listAll');
			},
			get: function(id){
				return $http.get(API_URL+'/get', { params: { id: id } });
			}
		}
	}])
	.factory('reportRunner', ['api', function(api){
		var listeners = [];

		var run = function(request){
			api.report(request).then(
				function(apiResp){
					var runResult = {
						request: request,
						response: apiResp.data
					};
					for(var i in listeners){
						var listener = listeners[i];
						listener(runResult);
					}
				},
				function(err){
					if(err.status === 400){
						// validation error
						for(var i in listeners){
							var listener = listeners[i];
							listener(null, err, null);
						}
					}else{
						// other error
						for(var i in listeners){
							var listener = listeners[i];
							listener(null, null, err);
						}
					}
					
				}
			);
		}

		var debouncedRun = debounce(
			function(request){
				// (arguments are passed through by debounce())
				run(request);
			}, 
			250 // delay ms, should be long enough to prevent reruns from angular $digest()
		);

		return {
			run: debouncedRun,
			/*
			 * listener is a function(apiResponse, validationErrorMessage, errorMessage)
			 */
			listen: function(listener){
				listeners.push(listener);
			}
		}
	}])
	.controller('Request', ['$scope', '$timeout', 'api', 'reportRunner', '$routeParams', 'nav', function($scope, $timeout, api, reportRunner, $routeParams, nav){
		var _isFiltersInit = false;
		
		// Params for API
		$scope.report = {
			name: null,
			dataObject: null, // TODO: rename to dataObjectName or modelName
			'fields[]': [], // have to do this, angular is silly
			filters: {},
			sort: null
		};

		$scope.defaultDataObject = 'Page';
		$scope.defaultColumns = {
			'ID': true,
			'Title': true,
			'LastEdited': true
		};

		
		$scope.dataObject = null;
		$scope.columns = JSON.parse(JSON.stringify($scope.defaultColumns));
		$scope.filters = null;

		$scope.sortBy = null;
		$scope.sortDesc = 1;
		$scope.limit = 20;
		$scope.offset = 0;
		
		$scope.dataObjects = null;



		$scope.mode = 'view';

		$scope.hasFilters = false;



		

		initFiltersBuilder();

		// TODO: use summary_fields as default columns
		
		api.getDataObjects().then(function(apiResp){
			debug('DataObjects: ', apiResp);
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
		}).then(function(){
			// If we have been told to load a report, load it
			if($routeParams.id){
				api.get($routeParams.id).then(function(data){
					var report = data.data;
					console.log('loaded report with id: '+$routeParams.id, report);
//					console.log('$scope.filters:', JSON.stringify($scope.filters));
					$scope.report.name = report.name;
					for(var i in $scope.dataObjects){
						var d = $scope.dataObjects[i];
						if(d.className == report.model){
							$scope.dataObject = d;
							break;
						}
					}
					$scope.columns = {};
					for(var i in report.fields){
						var fieldName = report.fields[i];
						$scope.columns[fieldName] = true;
					}
					// load filters into query builder (which will load them into our scope)
					var rulesToLoadIntoQueryBuilder = convertCustomToQueryBuilder(report.filter);
					console.log('converted rulesToLoadIntoQueryBuilder:', rulesToLoadIntoQueryBuilder);
					$('.filters-builder').queryBuilder('setRules', rulesToLoadIntoQueryBuilder);
					//
					$scope.sortDesc = report.sortDesc;
					if(report.sortBy){
						for(var i in $scope.dataObject.fields){
							var field = $scope.dataObject.fields[i];
							if(field.name == report.sortBy){
								$scope.sortBy = field;
								break;
							}
						}
					}
					$scope.limit = report.limit;
					$scope.offset = report.offset;
//					console.log('$scope.filters:', JSON.stringify($scope.filters));
					// update nav
					nav.setLocationString('#'+$routeParams.id+' '+$scope.report.name);
				});
			}
		})
		
		
		$scope.updateFiltersBuilder = function(){
			if(!$scope.dataObject) return;
			var filters = [];
			for(var i in $scope.dataObject.fields){
				var field = $scope.dataObject.fields[i];
				filters.push({
					id: field.definedOnTable+'.'+field.name,
					label: field.humanReadableName,
					type: convertSSFieldTypeToQueryBuilder(field.type)
				});
			}
			
			if(!_isFiltersInit){
				$('.filters-builder').queryBuilder({ filters: filters });
				_isFiltersInit = true;
			}
			$('.filters-builder').queryBuilder('setFilters', true, filters);
			console.log('setFilters', filters);
			_onFiltersChanged();
		};
		
		// external to angular, have to pull in changes manually
		var _onFiltersChanged = function(){
			if(!_isFiltersInit) return;
			
			// store rules
			var rules = $('.filters-builder').queryBuilder('getRules');
			$scope.filters = rules;
			
			$scope.filters = $scope.addHumanReadableNameToFilters($scope.filters);
			
			debug('rules:', $scope.filters);
		};
		
		$scope.addHumanReadableNameToFilters = function(node){
			if(node.field){
				var humanReadableName = null;
				for(var i in $scope.dataObjects){
					var d = $scope.dataObjects[i];
					for(var j in d.fields){
						var f = d.fields[j];
						var fullyQualifiedFieldName = d.className + '.' + f.name;
						if(fullyQualifiedFieldName == node.field){
							humanReadableName = f.humanReadableName;
							break;
						}
					}
					if(humanReadableName){
						// found in inner loop, break out
						break;
					}
				}
				node.humanReadableName = humanReadableName;
				return node;
			}else{
				// group
				for(var i in node.rules){
					node.rules[i] = $scope.addHumanReadableNameToFilters(node.rules[i]);
				}
				return node;
			}
		};

		$scope.updateHasFilters = function(){
			$scope.hasFilters = false;
			if($scope.filters && $scope.filters.condition) $scope.hasFilters = true;
		};
		
		$scope.updateReport = function(){
			if($scope.dataObject){
				$scope.report.dataObject = $scope.dataObject.className;
			}	
			$scope.report['fields[]'] = [];
			if($scope.columns){
				var colNames = Object.keys($scope.columns);
				for(var i in colNames){
					var colName = colNames[i];
					$scope.report['fields[]'].push(colName);
				}
			}
			if($scope.filters){
				$scope.report.filters = convertQueryBuilderToCustom($scope.filters);
//				console.log('$scope.report.filters', $scope.report.filters);
			}
			$scope.report.sortBy = null;
			if($scope.sortBy){
				$scope.report.sortBy = $scope.sortBy.name;
			}
			$scope.report.sortDesc = $scope.sortDesc;
			$scope.report.limit = $scope.limit;
			$scope.report.offset = $scope.offset;
		};

		$scope.runReport = function(){
			if(!$scope.report.dataObject) return;
			reportRunner.run($scope.report);
		};

		$scope.updateAndRunReport = function(){
			$scope.updateReport();
			$scope.runReport();
		};

		$scope.toggleColumnSelected = function(columnName){
			if($scope.columns[columnName]){
				delete $scope.columns[columnName];
			}else{
				$scope.columns[columnName] = true;
			}
		};

		$scope.toggleAllColumnsSelected = function(){
			var selectedCols = Object.keys($scope.columns);
			if(selectedCols.length == Object.keys($scope.dataObject.fields).length){
				// all selected, select none
				$scope.columns = {};
			}else{
				// select all
				for(var i in $scope.dataObject.fields){
					var field = $scope.dataObject.fields[i];
					$scope.columns[field.name] = true;
				}
			}
		};

		$scope.selectDefaultColumns = function(){
			$scope.columns = JSON.parse(JSON.stringify($scope.defaultColumns));
			$scope.selectOnlyExistingColumns();
		};

		$scope.selectOnlyExistingColumns = function(){
			// unselect columns that don't exist on this data object
			if(!$scope.dataObject) return;
			var filteredColumns = {};
			for(var col in $scope.columns){
				for(var i in $scope.dataObject.fields){
					var field = $scope.dataObject.fields[i];
					if(field.name == col){
						filteredColumns[col] = true;
						break;
					}
				}
			}
			$scope.columns = filteredColumns;
		};


		
		/*
		 * Watch expressions
		 */
		
		
		$scope.$watchGroup(['dataObject','filters', 'sortBy', 'sortDesc', 'limit'], $scope.updateAndRunReport);
		$scope.$watchCollection('columns', $scope.updateAndRunReport);
		$scope.$watch('dataObject', $scope.updateFiltersBuilder);

		$scope.$watch('dataObject', $scope.selectOnlyExistingColumns);

		$scope.$watch('filters', $scope.updateHasFilters);
		


		/*
		 * Init
		 */

		function initFiltersBuilder(){
			var events = [
				'afterAddGroup',
				'afterDeleteGroup',
				'afterAddRule',
				'afterDeleteRule',
				'afterUpdateRuleValue',
				'afterUpdateRuleFilter',
				'afterUpdateRuleOperator',
				'afterUpdateGroupCondition'
			];
			var eventStr = '';
			for(var i in events){
				var event = events[i] + '.queryBuilder';
				eventStr += event + ' ';
			}
			$('.filters-builder').on(eventStr+' change', function(){
				$timeout(function(){
					$scope.$apply(function(){
						_onFiltersChanged();
					});
				}, 0);
			});
		}
		
	}])
	.controller('Response', ['$scope', 'reportRunner', 'api', function($scope, reportRunner, api){
		
		reportRunner.listen(function(data, validationError, error){	
			// handle errors
			$scope.request = null;
			$scope.response = null;
			$scope.validationError = false;
			$scope.error = false;
			if(validationError){
				$scope.validationError = true;
				return
			}
			if(error){
				$scope.error = true;
				return;
			}
		
			$scope.request = data.request;
			$scope.response = data.response;

			// update limit
			$scope.limit = $scope.request.limit; // TODO: why? why not just do data.request.limit?
			debug('response: ', data.response);
		});
		
		$scope.limit = 20;
		$scope.limitObjs = [
			{ limit: 10 },
			{ limit: 20 },
			{ limit: 50 },
			{ limit: 100 },
		];
		$scope.otherLimit = 200;

		$scope.pageInfoEditMode = false;
		$scope.showOtherLimitForm = false;

		$scope.smartPaginationNumUiElements = 7;

		$scope.updateHeaderColumns = function(){
			if(!$scope.response) return;
			if(!$scope.response.rows) return;
			if($scope.response.rows.length == 0) return;
			
			// 1. get reference data object to pull out field names
			api.getDataObjects().then(function(apiResp){
				var allDataObjects = apiResp.data;
				var dataObject = $scope.getDataObjectByName(allDataObjects, $scope.request.dataObject);

				// 2. look up DataObject fields by first response row
				var r = [];
				for(var i in $scope.request['fields[]']){
					var respFieldName = $scope.request['fields[]'][i];
					var respField = null;
					for(var x in dataObject.fields){
						var reqField = dataObject.fields[x];
						if(reqField.name == respFieldName){
							respField = reqField;
							break;
						}
					}
					r.push(respField);
				};
				
				$scope.headerColumns = r; 
			});
		};

		$scope.getDataObjectByName = function(allDataObjects, name){
			for(var i in allDataObjects){
				var d = allDataObjects[i];
				if(d.className == name) return d;
			}
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
				var nearEnd = currentPageIndex >= $scope.pages.length - blockLength - 1;
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
			var updatedRequest = $scope.request;
			updatedRequest.sortBy = field.name;
			updatedRequest.sortDesc = desc ? 1 : 0;
			reportRunner.run(updatedRequest);
		};

		$scope.setLimit = function(newLimit){
			// TODO: not sure why direct set variable in template is not working
			$scope.limit = newLimit;
		};

		$scope.setPageInfoEditMode = function(flag){
			// TODO: not sure why direct set variable in template is not working
			$scope.pageInfoEditMode = flag;
		};

		$scope.closePageInfoEdit = function(){
			// TODO: not sure why direct set variable in template is not working
			$scope.pageInfoEditMode = false;
			$scope.showOtherLimitForm = false;
		};

		$scope.setShowOtherLimitForm = function(flag){
			// TODO: not sure why direct set variable in template is not working
			$scope.showOtherLimitForm = flag;
		};

		$scope.rerunWithNewLimit = function(){
			if(!$scope.request) return;
			if(!$scope.limit) return;
			var updatedRequest = $scope.request;
			updatedRequest.limit = $scope.limit;
			reportRunner.run(updatedRequest);
		};


		$scope.$watch('response', $scope.updateHeaderColumns);
		$scope.$watch('response', $scope.updatePagination);
		$scope.$watch('limit', $scope.rerunWithNewLimit);

	}])
	.controller('Persistance', ['$scope', 'reportRunner', 'api', '$location', function($scope, reportRunner, api, $location){
		var lastRequest = null;

		$scope.$location = $location;

		var setHasUnsavedChanges = function(flag){
			$('.genericreporting').toggleClass('has-unsaved-changes', flag);
		};

		reportRunner.listen(function(data, validationError, error){
			if(validationError || error){
				return;
			}

			var request = data.request;
			var isDifferent = JSON.stringify(request) != JSON.stringify(lastRequest);

			if(!lastRequest || isDifferent){
				lastRequest = request;
				if(!window.genericreporting) window.genericreporting = {};
				window.genericreporting.lastRequest = lastRequest;
				setHasUnsavedChanges(true);
			}
		});

		$('body').on('click', '.save-report-btn', function(){
			$scope.$apply(function(){
				//if(!$('.genericreporting').hasClass('has-unsaved-changes')) return;
				console.log('save!', lastRequest);
				setHasUnsavedChanges(false);

				api.save(lastRequest).then(function(apiResp){
					console.log('save resp:', apiResp);
					var newId = apiResp.data.ID;
					$location.path('/admin/reporting/view/'+newId);
				});
			});
		});

		$scope.viewSaved = function(){
			console.log('viewSaved');
			$location.path('/admin/reporting/saved');
		};

	}])
	.directive('pagination', function(){
		return {
			templateUrl: '/genericreporting/templates/angular/pagination.html'
		};
	})
	.directive('viewGroup', function(){
		return {
			scope: {
				filters: '=',
				isRoot: '='
			},
			templateUrl: '/genericreporting/templates/angular/view-group.html'
		};
	})
	.directive('viewRule', function(){
		return {
			scope: {
				filters: '='
			},
			templateUrl: '/genericreporting/templates/angular/view-rule.html'
		};
	});



	/*
	 * Helper functions
	 */

	function debug(){
		if(window.genericReportingDebug){
			console.log.apply(console, arguments);
		}
	};

	// Returns a function, that, as long as it continues to be invoked, will not
	// be triggered. The function will be called after it stops being called for
	// N milliseconds. If `immediate` is passed, trigger the function on the
	// leading edge, instead of the trailing.
	function debounce(func, wait, immediate) {
		var timeout;
		return function() {
			var context = this, args = arguments;
			var later = function() {
				timeout = null;
				if (!immediate) func.apply(context, args);
			};
			var callNow = immediate && !timeout;
			clearTimeout(timeout);
			timeout = setTimeout(later, wait);
			if (callNow) func.apply(context, args);
		};
	};

	function convertQueryBuilderToCustom(node){
		if(node.field){
			return {
				field:             node.field,
				operator:          node.operator,
				value:             node.value
			}
		}else{
			// group
			var r = {
				condition: node.condition,
				rules:     []
			};
			for(var i in node.rules){
				r.rules.push(convertQueryBuilderToCustom(node.rules[i]));
			}
			return r;
		}
	};
	function convertCustomToQueryBuilder(node){
		if(node.type == 'single'){
			return {
				id:       node.field,
				field:    node.field,
				operator: node.operation,
				value:    node.value
			}
		}else{
			// group
			var r = {
				condition: node.condition,
				rules: []
			};
			for(var i in node.rules){
				r.rules.push(convertCustomToQueryBuilder(node.rules[i]));
			}
			return r;
		}
	};
	function convertSSFieldTypeToQueryBuilder(type){
		if(type == 'Int') return 'integer';
		if(type == 'Varchar(255)') return 'string'; // TODO: other varchars
		if(type == 'SS_Datetime') return 'datetime';
		if(type == 'Text') return 'string';
		if(type == 'ForeignKey') return 'integer'; // TODO: use select type
		if(type == 'Boolean') return 'boolean';
		if(!type) return 'string';
	}
	if (typeof String.prototype.endsWith !== 'function') {
		String.prototype.endsWith = function(suffix) {
			return this.indexOf(suffix, this.length - suffix.length) !== -1;
		};
	}

})(jQuery);