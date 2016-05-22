<?php 


class ReportRunner {
	
	/**
	 * @return ReportResponse
	 */
	public function runReport(ReportRequest $request){
		$obj = $request->dataObject;
		
		$startTimeMs = $this->getTimestampMs();

		$dataQuery = null;
		$totalQuery = null;

		/*
		 * Data Query
		 */
		
		// select
		$dataQuery = new DataQuery($obj);
		/* @var $dataQuery DataQuery */

		if($request->fields) $dataQuery->setQueriedColumns($request->fields);
		// filter
		$request->filter->apply($dataQuery);
		// sort
		if($request->sortBy){
			$sortDescStr = $request->sortDesc ? 'DESC' : 'ASC';
			$dataQuery->sort($request->sortBy, $sortDescStr);
		}
		// limit and offset
		//  - we clone the data query here to get the total query because the total query is not limited
		$totalQuery = clone $dataQuery;
		//
		$dataQuery->limit($request->limit, $request->offset);


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
		$response->totalNumRows = $totalQuery->count();
		
		$endTimeMs = $this->getTimestampMs();
		$response->timeTakenMs = $endTimeMs - $startTimeMs;

		$response->offset = $request->offset;
		$response->limit = $request->limit;
		
		// DONE
		return $response;
	}

	protected function getTimestampMs(){
		return round(microtime(true) * 1000);
	}
	
}