<?php 


class ReportRunner {
	
	/**
	 * @return ReportResponse
	 */
	public function runReport(ReportRequest $request){
		$obj = $request->dataObject;
		
		/*
		 * Data Query
		 */
		
		// select
		$dataQuery = new DataQuery($obj);
		/* @var $dataQuery DataQuery */
		// TODO: column select
		// filter
		$request->filter->apply($dataQuery);
		// TODO: sorting
		// TODO: limit and offset / pagination
		// Run
		$response = new ReportResponse();
		$response->sql = $dataQuery->sql();
		
		$response->rows = array();
		foreach($dataQuery->execute() as $row){
			$response->rows[] = $row;
		}
		
		/*
		 * Total Query
		 */
		$response->totalNumRows = $dataQuery->count();
		
		
		// DONE
		return $response;
	}
	
}