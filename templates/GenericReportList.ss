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
	<h2>Saved Reports</h2>
	<section class="saved-reports" ng-controller="SavedReports">
		<ul>
			<li ng-repeat="report in reports">
				<a href="/dev/reporting/view/{{report.id}}">
					{{report.name}}
				</a>
			</li>
		</ul>
	</section>
	<a href="/dev/reporting/view">New</a>
</main>