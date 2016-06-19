<?php 


class ReportRequestBuilder {
	
	private static $default_limit = 20;


	/**
	  * @return true|string if invalid
	  */
	public function validate(SS_HTTPRequest $httpRequest){
		$dataObject = $httpRequest->requestVar('dataObject');
		if(!$dataObject) return 'Param dataObject required';

		$fields = $httpRequest->requestVar('fields');
		if(!$fields || count($fields) === 0) return 'Param fields required, and must have at least one.';

		return true;
	}
	
	/**
	 * @return ReportRequest|null if invalid
	 */
	public function getRequest(SS_HTTPRequest $httpRequest){
		if(!self::validate($httpRequest)) return null;

		$r = new ReportRequest();
		$r->Name = $httpRequest->requestVar('Name') ? $httpRequest->requestVar('Name') : 'Report';
		$r->Model = $httpRequest->requestVar('dataObject');
		$r->setFilter($this->buildFilterObjectFromArray($this->getFiltersArray($httpRequest)));
		$r->setFields($httpRequest->requestVar('fields'));
		$r->SortBy = $httpRequest->requestVar('sortBy');
		$r->SortDesc = (boolean) $httpRequest->requestVar('sortDesc');
		$r->Offset = $httpRequest->requestVar('offset') ? (int) $httpRequest->requestVar('offset') : 0;
		$r->Limit = $httpRequest->requestVar('limit') ? (int) $httpRequest->requestVar('limit') : self::$default_limit;
		
		return $r;
	}
	
	public function getFiltersArray(SS_HTTPRequest $httpRequest){
		return json_decode($httpRequest->requestVar('filters'), true);
	}
	
	/**
	 * @return IFilter
	 */
	public function buildFilterObjectFromArray(array $array){
		$filter = null;
		if(isset($array['field'])){
			$filter = new SingleFilter();
			$filter->field = $array['field'];
			$filter->operation = $array['operator'];
			$filter->value = $array['value'];
		}else{
			// group
			$filter = new CompositeFilter();
			if(isset($array['condition'])){
				$filter->type = $array['condition'];
				foreach($array['rules'] as $rule){
					$filter->rules[] = $this->buildFilterObjectFromArray($rule);
				}
			}
		}
		return $filter;
	}
	
}