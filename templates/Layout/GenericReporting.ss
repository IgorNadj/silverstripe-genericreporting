<div class="cms-content center genericreporting" data-layout-type="border">

	<div class="cms-content-header north" data-layout-type="border">
		<div class="cms-content-header-info">
			<% include CMSBreadcrumbs %>
		</div>
	</div>

	<div class="cms-content-header-tabs cms-tabset" style="z-index:61"> <!-- TODO: no clue why we have to z-index override here -->
		<ul class="cms-tabset-nav-primary">
			<li class="">
				<a href="#" class="genericreporting-home-link">
					Report
				</a>
			</li>
			<li class="">
				<a href="#" class="genericreporting-saved-link">
					Saved Reports
				</a>
			</li>
		</ul>
	</div>

	<div class="cms-content-fields center cms-panel-padded" data-layout-type="border">
		<div ng-app="GenericReportingApp">

			<div ng-view></div>

		</div>
	</div>

	<div class="cms-content-actions south" data-layout-type="border">
		<button class="save-report-btn">Save</button>
	</div>
	
</div>