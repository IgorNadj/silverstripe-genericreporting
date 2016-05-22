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


	public static $magic_fields = array(
		'SiteTree' => array(
			'ParentID' => 'Int', // no idea where this is defined...
		)
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
		// First we manually add in the base-level fields (ID, Created etc.)
		$r = array(
			array(
				'name' => 'ID', 
				'humanReadableName' => 'ID', 
				'type' => 'Int',
			),
			array(
				'name' => 'ClassName', 
				'humanReadableName' => 'Class Name', 
				'type' => 'Varchar(255)',
			),
			array(
				'name' => 'RecordClassName', 
				'humanReadableName' => 'Record Class Name', 
				'type' => 'Varchar(255)',
			),
			array(
				'name' => 'LastEdited', 
				'humanReadableName' => 'Last Edited', 
				'type' => 'SS_Datetime',
			),
			array(
				'name' => 'Created', 
				'humanReadableName' => 'Created', 
				'type' => 'SS_Datetime',
			),
		);
		
		$instance = new $className();
		/* @var $instance DataObject */
		
		// pre-fetch labels (human readable names) for performance
		$fieldLabelsMap = $instance->fieldLabels();

		// get all fields
		$allFields = $instance->db();
		$allFields = array_merge($allFields, self::getMagicFields($className));

		// build field spec
		foreach($allFields as $k => $v){
			$r[] = array(
				'name' => $k, 
				'humanReadableName' => $fieldLabelsMap[$k],
				'type' => $v,
			);
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
	

	/**
	  * @return array of name => type
	  */
	public static function getMagicFields($className){
		// direct match against registered magic fields
		if(isset(self::$magic_fields[$className])){
			return self::$magic_fields[$className];	
		}
		// otherwise if this is a subtype it will have those fields as well
		$reflectionClass = new ReflectionClass($className);
		foreach(self::$magic_fields as $magicClass => $magicClassFields){
			if($reflectionClass->isSubclassOf($magicClass)){
				return $magicClassFields;
			}
		}
		return array();
	}
	
}