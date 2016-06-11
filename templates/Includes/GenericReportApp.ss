<main ng-app="GenericReportingApp">
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
				<label>Model</label>
				<select ng-model="dataObject" ng-options="dataObject.humanReadableName for dataObject in dataObjects"></select>
			</fieldset>
			<fieldset>
				<label>Columns</label>
				<select multiple="multiple" ng-model="fields" ng-options="field.humanReadableName for field in dataObject.fields"></select>
			</fieldset>
			<fieldset>
				<label>Filters</label>
				<div class="filters-builder"></div>
				<pre class="filters-debug"></pre>
			</fieldset>
			<fieldset>
				<label>Results per page</label>
				<input ng-model="limit" />
			</fieldset>
			<button ng-click="mode = 'view'">View</button>
		</div>
	</section>
	<hr/>
	<section class="response" ng-controller="Response">
		<pagination></pagination>
		<table>
			<thead>
				<tr>
					<th ng-repeat="field in headerColumns" ng-if="response.rows.length > 0">
						<a ng-click="sortBy(field, false)" ng-if="request.sortBy != field.name">
							{{field.humanReadableName}}
						</a>
						<a ng-click="sortBy(field, true)" ng-if="request.sortBy == field.name && request.sortDesc == 0">
							{{field.humanReadableName}}
							<span class="indicator">[^]</span>
						</a>
						<a ng-click="sortBy(field, false)" ng-if="request.sortBy == field.name && request.sortDesc == 1">
							{{field.humanReadableName}}
							<span class="indicator">[v]</span>
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
		<pagination></pagination>
	
		<div class="time-taken">
			Took {{response.timeTakenMs/1000}} seconds 
		</div>

		<pre>{{response.sql}}</pre>


	
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