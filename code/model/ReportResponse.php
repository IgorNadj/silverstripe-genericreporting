<?php 


class ReportResponse {
	
	public $sql; // for debugging
	public $request; 
	
	public $rows = array();
	
	public $offset;
	public $limit;
	public $totalNumRows;

	public $timeTakenMs;
	
}