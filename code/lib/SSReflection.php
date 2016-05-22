<?php 

class SSReflection {
	
	/*
	 * Some built-in classes don't have singular_name set properly, so we have to fix it here.
	 * TODO: raise PRs to get these added
	 */
	public static $missing_singular_name_map = array(
		'Image' => 'Image',
		'Image_Cached' => 'Image_Cached',
	); 

	/**
	 * @return array of ReflectionClass
	 */
	public static function getAllDataObjectClasses(){
		$r = array();
		
		$loader = SS_ClassLoader::instance();
		$manifest = $loader->getManifest();

		foreach($manifest->getClasses() as $lowercaseClassName => $absFilePath){
			$reflectionClass = new ReflectionClass($lowercaseClassName);
			if($reflectionClass->isSubclassOf('DataObject') && !$reflectionClass->implementsInterface('TestOnly')){
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
	

	public static function getClassSingularName($className){
		if(isset(self::$missing_singular_name_map[$className])){
			return self::$missing_singular_name_map[$className];
		}
		$obj = new $className();
		return $obj->singular_name();
	}
	
	
}