<?php 


class ReportRequestBuilder {
	
	private static $default_limit = 20;


	/**
	  * @return true|string if invalid
	  */
	public function validate(SS_HTTPRequest $request){ // TODO: rename argument to httpRequest for clarity
		$dataObject = $request->requestVar('dataObject');
		if(!$dataObject) return 'Param dataObject required';

		$fields = $request->requestVar('fields');
		if(!$fields || count($fields) === 0) return 'Param fields required, and must have at least one.';

		return true;
	}
	
	/**
	 * @return ReportRequest|null if invalid
	 */
	public function getRequest(SS_HTTPRequest $request){
		if(!self::validate($request)) return null;

		$r = new ReportRequest();
		$r->Name = $request->requestVar('Name') ? $request->requestVar('Name') : 'Report';
		$r->Model = $request->requestVar('dataObject');
		$r->setFilter($this->buildFilterObjectFromArray($this->getFiltersArray($request)));
		$r->setFields($request->requestVar('fields'));
		$r->SortBy = $request->requestVar('sortBy');
		$r->SortDesc = (boolean) $request->requestVar('sortDesc');
		$r->Offset = $request->requestVar('offset') ? (int) $request->requestVar('offset') : 0;
		$r->Limit = $request->requestVar('limit') ? (int) $request->requestVar('limit') : self::$default_limit;
		
		return $r;
	}
	
	public function getFiltersArray(SS_HTTPRequest $request){
		return json_decode($request->requestVar('filters'), true);
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