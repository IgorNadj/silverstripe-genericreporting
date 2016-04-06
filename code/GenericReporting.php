<?php 

class GenericReporting extends Controller {
	
	private static $allowed_actions = array(
		'getDataObjects',
		'report'
	);
	
	public function index(){
		return $this->renderWith('GenericReporting');
	}
	
	public function getDataObjects($request){
		$r = array();
		foreach(SSReflection::getAllDataObjectClasses() as $class){
			/* @var $rClass ReflectionClass */
			$d = new DataObjectReflection();
			$d->className = $class->getName();
			$d->fields = SSReflection::getDataObjectFields($class->getName());
			
			$r[] = $d;
		}
		echo $this->formatResponse($request, $r);
	}
	
	/**
	 * Request param modelClassName required, everything else optional
	 */
	public function report($httpRequest){
		$builder = new ReportBuilder();
		
		$request = $builder->getRequest($httpRequest);
		if(!$request) return;
		
// 		die('request: <pre>'.print_r($request,true));
		
		
		$response = $this->runReport($request);
		
// 		$data = array(
// 			'sql' => $response->sql,
// 			'rows' => $response->rows,
// 			'totalNumRows' => $response->totalNumRows,
// 		);
		
		return $this->formatResponse($httpRequest, $response);
	}
	
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
	
	
	public function formatResponse(SS_HTTPRequest $request, $data){
		// TODO: switch formats based on request param
		return json_encode($data);
	}
	
	
}

class DataObjectReflection {
	
	public $className;
	public $fields;
	
}