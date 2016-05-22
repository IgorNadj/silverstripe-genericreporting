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
			<select ng-model="dataObject" ng-options="dataObject.className for dataObject in dataObjects"></select>
		</fieldset>
		<fieldset>
			<label>Columns</label>
			<select multiple="multiple" ng-model="fields" ng-options="field.name for field in dataObject.fields"></select>
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
	</section>
	<hr/>
	<section class="response" ng-controller="Response">
		<table>
			<thead>
				<tr>
					<th ng-repeat="(key, value) in response.rows[0]" ng-if="response.rows.length > 0">
						{{key}}
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
		
		<div class="total-num-rows">Total rows: {{response.totalNumRows}}</div>
	
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