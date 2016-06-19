<?php 

class GenericReporting extends Controller {
	
	private static $allowed_actions = array(
		'getDataObjects',
		'report',
		'view',
		'saveReport',
	);
	

	
	/*
	 * Views
	 */
	
	public function index(){
		return $this->renderWith('GenericReportList');
	}
	
	public function view(SS_HTTPRequest $request){
		$id = $request->param('ID');
		if(!$id){
			// no id provided, start from scratch
			
		}
		
		return $this->renderWith('GenericReport');
	}
	

	
	
	/*
	 * API calls
	 */
	
	public function getDataObjects($request){
		$r = array();
		foreach(SSReflection::getAllDataObjectClasses() as $class){
			/* @var $rClass ReflectionClass */
			$d = new DataObjectReflection();
			
			$d->className = $class->getName();
			$d->humanReadableName = SSReflection::getClassSingularName($d->className);
			$d->humanReadableNamePlural = SSReflection::getClassPluralName($d->className);

			$d->fields = SSReflection::getDataObjectFields($class->getName());

			$r[] = $d;
		}
		echo $this->formatResponse($request, $r);
	}
	
	public function report($httpRequest){
		$builder = new ReportRequestBuilder();
		$runner = new ReportRunner();
		
		$request = $builder->getRequest($httpRequest);
		//die('req<pre>'.print_r($request,true));
		if(!$request) return $this->httpError(400, 'Invalid report parameters');
		
		$response = $runner->runReport($request);
		
		return $this->formatResponse($httpRequest, $response);
	}
	
	public function formatResponse(SS_HTTPRequest $request, $data){
		// TODO: switch formats based on request param
		$this->getResponse()->addHeader('Content-Type', 'application/json');
		return json_encode($data);
	}
	
	public function saveReport(SS_HTTPRequest $request){
		// TODO
	}
	
	
}

class DataObjectReflection {
	
	public $className;
	public $fields;
	
}