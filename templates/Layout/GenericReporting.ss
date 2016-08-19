<div class="cms-content center genericreporting" data-layout-type="border" ng-app="GenericReportingApp">

	<div class="cms-content-header north" data-layout-type="border">
		<div class="cms-content-header-info">
			<div class="breadcrumbs-wrapper" ng-controller="Breadcrumbs"">
				<h2 id="page-title-heading">
					<div ng-if="nested">
						<a class="cms-panel-link crumb" href="/admin/reporting/">Reporting</a>
						<span class="sep">/</span>
						<span class="cms-panel-link crumb last">{{title}}</span>
					</div>
					<div ng-if="!nested">
						<span class="cms-panel-link crumb last">Reporting</span>
					</div>
				</h2>
			</div>
		</div>
	</div>

	<div class="cms-content-header-tabs cms-tabset" style="z-index:61"> <!-- TODO: no clue why we have to z-index override here -->
		<ul class="cms-tabset-nav-primary ui-tabs-nav" ng-controller="NavTabs">
			<li class="ui-state-default" ng-class="{'ui-tabs-active ui-state-active': activeTab == 'report'}">
				<a ng-href="" ng-click="goToReport()">
					Report
				</a>
			</li>
			<li class="ui-state-default" ng-class="{'ui-tabs-active ui-state-active': activeTab == 'saved'}">
				<a ng-href="" ng-click="goToSaved()">
					Saved Reports
				</a>
			</li>
		</ul>
	</div>

	<div class="cms-content-fields center cms-panel-padded" data-layout-type="border">
		<div>

			<div ng-view></div>

		</div>
	</div>

	<div class="cms-content-actions south" data-layout-type="border">
		<button class="save-report-btn">Save</button>
	</div>

</div>