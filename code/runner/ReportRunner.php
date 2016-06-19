<?php 


class ReportRunner {
	
	/**
	 * @return ReportResponse
	 */
	public function runReport(ReportRequest $request){
		$obj = $request->Model;
		
		$startTimeMs = $this->getTimestampMs();

		$dataQuery = null;
		$totalQuery = null;

		$fields = $request->getFields();
		$filter = $request->getFilter();

		/*
		 * Data Query
		 */
		
		// select
		$dataQuery = new DataQuery($obj);
		/* @var $dataQuery DataQuery */

		// columns
		$dataQuery->setQueriedColumns($fields);
		// where
		$filter->apply($dataQuery);
		// sort
		if($request->SortBy){
			$sortDescStr = $request->SortDesc ? 'DESC' : 'ASC';
			$dataQuery->sort($request->SortBy, $sortDescStr);
		}
		// limit and offset
		//  - we clone the data query here to get the total query because the total query is not limited
		$totalQuery = clone $dataQuery;
		//
		$dataQuery->limit($request->Limit, $request->Offset);

		// Run
		$response = new ReportResponse();
		$response->sql = $dataQuery->sql();

		$list = GenericReportingDataList::create($obj);
		/* @var $list GenericReportingDataList */
		$list = $list->setDataQuery($dataQuery);
		$rows = $list->getViewableRows();
		
		// setQueriedColumns adds more than we need, we have to filter them out
		foreach($rows as $row){
			$rowExpectedColsOnly = array();
			foreach($fields as $field){
				$rowExpectedColsOnly[$field] = $row[$field];
			}
			$response->rows[] = $rowExpectedColsOnly;
		}

		
		
		/*
		 * Total Query
		 */
		$response->totalNumRows = $totalQuery->count();
		
		$endTimeMs = $this->getTimestampMs();
		$response->timeTakenMs = $endTimeMs - $startTimeMs;

		$response->offset = $request->Offset;
		$response->limit = $request->Limit;
		
		// DONE
		return $response;
	}

	protected function getTimestampMs(){
		return round(microtime(true) * 1000);
	}
	
}

class GenericReportingDataList extends DataList {

	/**
	  * @return array of row data if canView
	  */
	public function getViewableRows(){
		$query = $this->dataQuery->query();
		$rows = $query->execute();
		$results = array();

		foreach($rows as $row) {
			$obj = $this->createDataObject($row);
			if($obj->canView()){
				$results[] = $row;
			}else{
				$results[] = array();
			}
		}

		return $results;
	}

}