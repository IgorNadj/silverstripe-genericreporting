<?php 


class SingleFilter implements IFilter {
	
	public $field;
	public $operation;
	public $value;
	

	public function apply(DataQuery $dataQuery){
		$field = $this->field;
		$fieldEscaped = $this->escapeColumnName($field);
		$op = $this->operation;
		$value = $this->value;
		
		// heyo long list of if statements...!
		$sql = '';
		$param = $value;
		if($op == 'equal'){
			$sql = $fieldEscaped.' = ?';
		}
		if($op == 'not_equal'){
			$sql = $fieldEscaped.' <> ?';
		}
		if($op == 'in'){
			$sql = $fieldEscaped.' IN(?)';
		}
		if($op == 'not_in'){
			$sql = $fieldEscaped.' NOT IN(?)';
		}
		if($op == 'less'){
			$sql = $fieldEscaped.' < ?';
		}
		if($op == 'less_or_equal'){
			$sql = $fieldEscaped.' <= ?';
		}
		if($op == 'greater'){
			$sql = $fieldEscaped.' > ?';
		}
		if($op == 'greater_or_equal'){
			$sql = $fieldEscaped.' >= ?';
		}
		if($op == 'between'){
			throw new Exception('not supported');
		}
		if($op == 'not_between'){
			throw new Exception('not supported');
		}
		if($op == 'begins_with'){
			$sql = $fieldEscaped.' LIKE(?)';
			$param = $value.'%';
		}
		if($op == 'not_begins_with'){
			$sql = $fieldEscaped.' NOT LIKE(?)';
			$param = $value.'%';
		}
		if($op == 'contains'){
			$sql = $fieldEscaped.' LIKE(?)';
			$param = '%'.$value.'%';
		}
		if($op == 'not_contains'){
			$sql = $fieldEscaped.' NOT LIKE(?)';
			$param = '%'.$value.'%';
		}
		if($op == 'ends_with'){
			$sql = $fieldEscaped.' LIKE(?)';
			$param = '%'.$value;
		}
		if($op == 'not_ends_with'){
			$sql = $fieldEscaped.' NOT LIKE(?)';
			$param = '%'.$value;
		}
		if($op == 'is_empty'){
			$sql = $fieldEscaped.' = ?';
			$param = '';
		}
		if($op == 'is_not_empty'){
			$sql = $fieldEscaped.' <> ?';
			$param = '';
		}
		if($op == 'is_null'){
			$sql = $fieldEscaped.' IS NULL';
			$param = null;
		}
		if($op == 'is_not_null'){
			$sql = $fieldEscaped.' IS NOT NULL';
			$param = null;
		}

		if($param !== null){
			$dataQuery->where(array($sql => $param));
		}else{
			$dataQuery->where($sql);
		}
		
	}
	
	protected function escapeColumnName($tableAndCol){
		$parts = explode('.', $tableAndCol);
		$table = $parts[0];
		$col = $parts[1];
		return '"'.$table.'"."'.$col.'"'; // FIXME: do better, this is a massive security hole
	}
	
}