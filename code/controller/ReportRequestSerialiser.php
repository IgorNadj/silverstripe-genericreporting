<?php 


class ReportRequestSerialiser {

	/**
	 * @return array 
	 */
	public function serialise(ReportRequest $request){
		$r = array();

		$r['name']     = $request->Name;
		$r['model']    = $request->Model;
		$r['fields']   = $request->getFields();
		$r['filter']   = $this->serialiseFilter($request->getFilter());
		$r['sortBy']   = $request->SortBy;
		$r['sortDesc'] = $request->SortDesc;
		$r['Limit']    = $request->Limit;
		$r['Offset']   = $request->Offset;

		return $r;
	}

	/**
	 * @return array
	 */
	public function serialiseFilter(IFilter $filter){
		if($filter instanceof SingleFilter){
			return array(
				'type'      => 'single',
				'field'     => $filter->field,
				'operation' => $filter->field,
				'value'     => $filter->field,
			);
		}else if($filter instanceof CompositeFilter){
			$r = array(
				'type' => 'composite',
				'condition' => $filter->type,
				'rules' => array(),
			);
			foreach($filter->rules as $rule){
				$r['rules'][] = $this->serialiseFilter($rule);
			}
			return $r;
		}
	}

}