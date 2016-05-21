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

		if($request->fields) $dataQuery->setQueriedColumns($request->fields);
		// filter
		$request->filter->apply($dataQuery);
		// TODO: sorting
		// TODO: limit and offset / pagination
		// Run
		$response = new ReportResponse();
		$response->sql = $dataQuery->sql();
		$response->request = $request;
		
		$response->rows = array();
		foreach($dataQuery->execute() as $row){
			// setQueriedColumns adds more than we need, we have to filter them out
			$rowExpectedColsOnly = array();
			if($request->fields){
				foreach($request->fields as $field){
					$rowExpectedColsOnly[$field] = $row[$field];
				}
			}else{
				$rowExpectedColsOnly = $row;
			}
			
			$response->rows[] = $rowExpectedColsOnly;
		}
		
		/*
		 * Total Query
		 */
		$response->totalNumRows = $dataQuery->count();
		
		
		// DONE
		return $response;
	}
	
}