<?php 


class CompositeFilter implements IFilter {
	
	private static $types = array('AND', 'OR');
	
	public $type;
	public $rules = array();
	
	public function apply(DataQuery $dataQuery){
		$subQuery = null;
		if($this->type == 'AND'){
			$subQuery = $dataQuery->conjunctiveGroup();
		}else{
			$subQuery = $dataQuery->disjunctiveGroup();
		}
		
		foreach($this->rules as $rule){
			/* @var $rule BaseFilter */
			$rule->apply($subQuery);
		}
	}
	
}