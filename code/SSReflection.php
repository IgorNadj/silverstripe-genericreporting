<?php 

class SSReflection {
	
	/**
	 * @return array of ReflectionClass
	 */
	public static function getAllDataObjectClasses(){
		$r = array();
		
		$loader = SS_ClassLoader::instance();
		$manifest = $loader->getManifest();

		foreach($manifest->getClasses() as $lowercaseClassName => $absFilePath){
			$reflectionClass = new ReflectionClass($lowercaseClassName);
			if($reflectionClass->isSubclassOf('DataObject')){
				$r[] = $reflectionClass;
			}
		}
		
		return $r;
	}
	
	/**
	 * returns $db of a DataObject, including inherited
	 * @return array of array('name' => string, 'type' => string);
	 */
	public static function getDataObjectFields($className){
		$r = array();
		
		// First we manually add in the base-level fields (ID, Created etc.)
		$r[] = array('name' => 'ID',         'type' => 'Int');
		$r[] = array('name' => 'ClassName',  'type' => 'Varchar(255)');
		$r[] = array('name' => 'LastEdited', 'type' => 'SS_Datetime');
		$r[] = array('name' => 'Created',    'type' => 'SS_Datetime');
		
		$instance = new $className();
		/* @var $instance DataObject */
		foreach($instance->db() as $k => $v){
			$r[] = array('name' => $k, 'type' => $v);
		}
		
		return $r;
	}
	
	
	
}