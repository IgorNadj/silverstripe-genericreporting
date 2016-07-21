<div class="cms-content center genericreporting" data-layout-type="border">

	<div class="cms-content-header north" data-layout-type="border">
		<div class="cms-content-header-info">
			<% include CMSBreadcrumbs %>
		</div>
	</div>

	<div class="cms-content-fields center cms-panel-padded" data-layout-type="border">
		<div ng-app="GenericReportingApp">

			<div ng-view></div>
			
			 <hr />

			<a href="/admin/reporting">home</a>
			<a href="/admin/reporting/saved">saved</a>

		</div>
	</div>

	<div class="cms-content-actions south" data-layout-type="border">
		<button class="save-report-btn">Save</button>
	</div>
	
</div>