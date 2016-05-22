<?php 


class ReportRequest {
	
	public $dataObject;
	public $fields = array();

	
	
	/**
	 * @var $filter BaseFilter
	 */
	public $filter;
	
	public $sortBy;
	public $sortDesc = true;
	
}

