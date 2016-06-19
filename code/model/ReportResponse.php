<?php 


class ReportResponse {
	
	public $sql; // for debugging

	public $rows = array();
	
	public $offset;
	public $limit;
	public $totalNumRows;

	public $timeTakenMs;
	
}