<?php 


class ReportRequestBuilder {
	
	private static $default_limit = 20;

	
	/**
	 * @return ReportRequest|null
	 */
	public static function getRequest(SS_HTTPRequest $request){
		$dataObject = $request->getVar('dataObject');
		if(!$dataObject) return null;

		$fields = $request->getVar('fields');
		if(!$fields || count($fields) === 0) return null;
		
		$r = new ReportRequest();
		$r->Model = $dataObject;
		$r->setFilter(self::buildFilterObjectFromArray(self::getFiltersArray($request)));
		$r->setFields($fields);
		$r->SortBy = $request->getVar('sortBy');
		$r->SortDesc = (boolean) $request->getVar('sortDesc');
		$r->Offset = $request->getVar('offset') ? (int) $request->getVar('offset') : 0;
		$r->Limit = $request->getVar('limit') ? (int) $request->getVar('limit') : self::$default_limit;
		
		return $r;
	}
	
	public static function getFiltersArray(SS_HTTPRequest $request){
		return json_decode($request->getVar('filters'), true);
	}
	
	/**
	 * @return IFilter
	 */
	public static function buildFilterObjectFromArray(array $array){
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
					$filter->rules[] = self::buildFilterObjectFromArray($rule);
				}
			}
		}
		return $filter;
	}
	
}