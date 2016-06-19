<?php 


class ReportRequest extends DataObject {

	private static $db = array(
		'Name'             => 'Varchar',
		'Model'            => 'Varchar',
		'FieldsSerialized' => 'Text',
		'FilterSerialized' => 'Text',
		'SortBy'           => 'Varchar',
		'SortDesc'         => 'Boolean',
		'Limit'            => 'Int',
		'Offset'           => 'Int',
	);



	public function setFields(array $fields){
		$this->FieldsSerialized = serialize($fields);
	}

	/**
	  * @return array of string field names
	  */
	public function getFields(){
		return unserialize($this->FieldsSerialized);
	}


	public function setFilter(IFilter $filter){
		$this->FilterSerialized = serialize($filter);
	}

	/**
	  * @return IFilter
	  */
	public function getFilter(){
		return unserialize($this->FilterSerialized);
	}

}

