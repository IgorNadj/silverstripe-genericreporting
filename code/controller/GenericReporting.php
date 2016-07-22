<?php 

class GenericReporting extends Controller {
	
	private static $allowed_actions = array(
		'getDataObjects',
		'report',
		'save',
		'listAll',
		'get',
	);
	

	
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
	
	public function report(SS_HTTPRequest $httpRequest){
		$builder = new ReportRequestBuilder();
		$runner = new ReportRunner();
		
		$validationResult = $builder->validate($httpRequest);
		if($validationResult !== true){
			return $this->validationError($validationResult);
		}

		$request = $builder->getRequest($httpRequest);
		$response = $runner->runReport($request);
		return $this->formatResponse($httpRequest, $response);
	}

	public function formatResponse(SS_HTTPRequest $request, $data){
		// TODO: switch formats based on request param
		$this->getResponse()->addHeader('Content-Type', 'application/json');
		return json_encode($data);
	}

	public function save(SS_HTTPRequest $httpRequest){
		$builder = new ReportRequestBuilder();

		$validationResult = $builder->validate($httpRequest);
		if($validationResult !== true){
			return $this->validationError($validationResult);
		}

		$request = $builder->getRequest($httpRequest);

		$request->write();
		$data = array(
			'ID'   => $request->ID,
			'Name' => $request->Name,
		);
		return $this->formatResponse($httpRequest, $data);
	}


	public function listAll(SS_HTTPRequest $httpRequest){
		$data = array();
		foreach(ReportRequest::get() as $request){
			$data[] = array(
				'ID'   => $request->ID,
				'Name' => $request->Name,
			);
		}
		return $this->formatResponse($httpRequest, $data);
	}

	public function get(SS_HTTPRequest $httpRequest){
		$id = $httpRequest->getVar('id');
		if(!$id) return $this->httpError(400, 'Param id required');
		
		$request = ReportRequest::get()->byID($id);
		if(!$request) return $this->httpError(404, 'Report not found');
		
		$serialiser = new ReportRequestSerialiser();
		$data = $serialiser->serialise($request);
		
		return $this->formatResponse($httpRequest, $data);
	}
	

	protected function validationError($msg){
		return $this->httpError(400, 'Invalid report parameters: '.$msg);
	}
	
}

class DataObjectReflection {
	
	public $className;
	public $fields;
	
}