<?php 


interface IFilter {
	
	public function apply(DataQuery $dataQuery);
	
}