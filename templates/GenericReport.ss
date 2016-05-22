<script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.5.0-rc.2/angular.min.js"></script>
<script src="/framework/thirdparty/jquery/jquery.js"></script>
<script src="/genericreporting/javascript/query-builder.standalone.min.js"></script>
<script src="/genericreporting/javascript/genericreporting.js"></script>

<style>
	label { display: block; padding: 1em; }
	td, th { border: 1px solid #aaa; padding: 0.5em 1em; }
	table { border-collapse: collapse; }
	th { font-weight: bold; background: rgba(0,0,0,0.1); }
</style>

<main ng-app="GenericReportingApp">
	<section class="request" ng-controller="Request">
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
			<label>Sort</label>
			<select ng-model="sortBy" ng-options="field.name for field in dataObject.fields"></select>
			<div>
				<label>
					<input type="radio" name="sortDesc" ng-model="sortDesc" value="1" />
					Descending
				</label>
				<label>
					<input type="radio" name="sortDesc" ng-model="sortDesc" value="0" /> 
					Ascending
				</label>
			</div>
		</fieldset>
		<fieldset>
			<label>Number of results</label>
			<input ng-model="limit" />
		</fieldset>
	</section>
	<hr/>
	<section class="response" ng-controller="Response">
		<table>
			<thead>
				<tr>
					<th ng-repeat="field in headerColumns" ng-if="response.rows.length > 0">
						{{field.humanReadableName}}
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
		<div class="pagination">
			<div class="page-info">
				Showing rows <span ng-bind="firstRowNumber"></span> to 
				<span ng-bind="lastRowNumber"></span> of 
				<span ng-bind="response.totalNumRows"></span>
			</div>

			<div class="page-nav">
				<button ng-disabled="!hasPrevious" ng-click="goToPreviousPage()"> Previous </button>
				<ol class="pages">
					<li ng-repeat="page in smartPages">
						<span class="spacer" ng-if="page.spacer">..</span>
						<span class="current-page" ng-if="!page.spacer && page.isCurrentPage" ng-bind="page.number"></span>
						<a class="page-link" ng-if="!page.spacer && !page.isCurrentPage" ng-click="goToOffset(page.offset)" ng-bind="page.number"></a>
					</li>
				</ul>
				<button ng-disabled="!hasNext" ng-click="goToNextPage()"> Next </button>
			</div>
		</div>
	
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