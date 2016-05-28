<?php


class GenericReport extends DataObject {
	
	private static $db = array(
		'Title' => 'Varchar',
		'Spec' => 'Text',
	);


	public function getLink(){
		return GenericReportingAdmin::getViewReportLink($this->ID);
	}

}