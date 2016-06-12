<main ng-app="GenericReportingApp" class="genericreporting">
	<section class="request" ng-controller="Request">
		<div ng-show="mode == 'view'" class="view-mode summary">
			<span class="view-model-name">{{dataObject.humanReadableNamePlural}}</span>
			
			<span ng-if="hasFilters">
				<span class="view-filters-header">where</span>
				<view-group filters="filters" is-root="true"></view-group>
			</span>

			<div class="view-mode-buttons">
				<button ng-click="mode = 'edit'">Edit</button>
			</div>
		</div>
		<div ng-show="mode == 'edit'" class="edit-mode form">
			<fieldset>
				<h3>Model</h3>
				<select ng-model="dataObject" ng-options="dataObject.humanReadableName for dataObject in dataObjects"></select>
			</fieldset>
			<fieldset>
				<h3>Filters</h3>
				<div class="filters-builder"></div>
			</fieldset>
			<fieldset>
				<h3>Columns</h3>
				<div class="columns-set">
					<label ng-repeat="field in dataObject.fields" class="column-checkbox">
						<input type="checkbox" ng-checked="columns[field.name]" ng-click="toggleColumnSelected(field.name)" />
						<span>{{field.humanReadableName}}</span>
					</label>
				</div>
				<div class="columns-set-meta">
					<button ng-click="toggleAllColumnsSelected()">Select All</button>
					<button ng-click="selectDefaultColumns()">Select Default Columns</button>
				</div>
			</fieldset>
			<fieldset>
				<label>Results per page</label>
				<input ng-model="limit" />
			</fieldset>
			<button ng-click="mode = 'view'">Done</button>
		</div>
	</section>
	<hr/>
	<section class="response" ng-controller="Response">
		<div class="pagination-wrapper top">
			<pagination></pagination>
		</div>
		<table>
			<thead>
				<tr>
					<th ng-repeat="field in headerColumns" ng-if="response.rows.length > 0">
						<a ng-click="sortBy(field, false)" ng-if="request.sortBy != field.name">
							{{field.humanReadableName}}
						</a>
						<a ng-click="sortBy(field, true)" ng-if="request.sortBy == field.name && request.sortDesc == 0">
							{{field.humanReadableName}}
							<span class="indicator">↑</span>
						</a>
						<a ng-click="sortBy(field, false)" ng-if="request.sortBy == field.name && request.sortDesc == 1">
							{{field.humanReadableName}}
							<span class="indicator">↓</span>
						</a>
					</th>
				</tr>
			</thead>
			<tbody>
				<tr ng-repeat="row in response.rows">
					<td ng-repeat="(key, value) in row">
						{{value}}
					</td>
				</tr>
			</tbody>
		</table>
		<div class="pagination-wrapper bottom">
			<pagination></pagination>
		</div>
		
	
		<div class="time-taken">
			Took {{response.timeTakenMs/1000}} seconds 
		</div>
	
	</section>
	<hr/>
	<section class="persistance" ng-controller="Persistance">
		<label>
			Name
			<input type="text" ng-bind="toSave.name" />
		</label>
		<a href="" ng-click="save">Save</a>
	</section>
</main>