<?php 


class ReportRunner {
	
	/**
	 * @return ReportResponse
	 */
	public function runReport(ReportRequest $request){
		$obj = $request->dataObject;
		
		$startTimeMs = $this->getTimestampMs();

		/*
		 * Data Query
		 */
		
		// select
		$dataQuery = new DataQuery($obj);
		/* @var $dataQuery DataQuery */

		if($request->fields) $dataQuery->setQueriedColumns($request->fields);
		// filter
		$request->filter->apply($dataQuery);
		
		if($request->sortBy){
			$sortDescStr = $request->sortDesc ? 'DESC' : 'ASC';
			$dataQuery->sort($request->sortBy, $sortDescStr);
		}
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
		
		$endTimeMs = $this->getTimestampMs();
		$response->timeTakenMs = $endTimeMs - $startTimeMs;

		
		// DONE
		return $response;
	}

	protected function getTimestampMs(){
		return round(microtime(true) * 1000);
	}
	
}