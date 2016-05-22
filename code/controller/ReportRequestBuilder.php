<?php 


class ReportRequestBuilder {
	
	
	/**
	 * @return ReportRequest|null
	 */
	public static function getRequest(SS_HTTPRequest $request){
		$dataObject = $request->getVar('dataObject');
		if(!$dataObject) return null;
		
		$r = new ReportRequest();
		$r->dataObject = $dataObject;
		$r->filter = self::buildFilterObjectFromArray(self::getFiltersArray($request));
		$r->fields = $request->getVar('fields');
		$r->sortBy = $request->getVar('sortBy');
		$r->sortDesc = (boolean) $request->getVar('sortDesc');
		if($request->getVar('offset')) $r->offset = (int) $request->getVar('offset');
		if($request->getVar('limit')) $r->limit = (int) $request->getVar('limit');
		
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