<?php 


class ReportRequest {

	public $dataObject;
	public $fields = array();

	
	
	/**
	 * @var $filter IFilter
	 */
	public $filter;
	
	public $sortBy;
	public $sortDesc = true;

	public $limit = 20;
	public $offset = 0;
	
}

