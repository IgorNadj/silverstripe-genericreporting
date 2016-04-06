<script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.5.0-rc.2/angular.min.js"></script>
<script src="/vendor/components/jquery/jquery.js"></script>
<script src="/vendor/mistic100/jquery-querybuilder/dist/js/query-builder.standalone.js"></script>
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
	
		<pre>{{response.sql}}</pre>
	
	</section>
</main>