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
	
	public function report($httpRequest){
		$builder = new ReportRequestBuilder();
		$runner = new ReportRunner();
		
		$request = $builder->getRequest($httpRequest);
		if(!$request) return;
		
		$response = $runner->runReport($request);
		
		return $this->formatResponse($httpRequest, $response);
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