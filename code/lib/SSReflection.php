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

	/*
	 * See $missing_singular_name_map
	 */
	public static $missing_plural_name_map = array(
		'Image' => 'Images',
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
	public static function getDataObjectFields($className, $childClassName = null){
		$r = array();

		// First we manually add in the base-level fields
		foreach(DataObject::database_fields($className) as $name => $spec){
			$humanReadableName = $name; // TODO
			$r[] = array(
				'name' => $name,
				'type' => $spec,
				'humanReadableName' => $humanReadableName,
				'definedOnTable' => $childClassName,
				'definedOnClass' => $childClassName, 
			);
		}

		// Then we add inherited fields
		if($className == 'DataObject'){
			$always = array(
				array(
					'name' => 'ID', 
					'humanReadableName' => 'ID', 
					'type' => 'Int',
					'definedOnTable' => $childClassName, // e.g. SiteTree has ID, not DataObject
					'definedOnClass' => $className,
				),
				array(
					'name' => 'RecordClassName', 
					'humanReadableName' => 'Record Class Name', 
					'type' => 'Varchar(255)',
					'definedOnTable' => $childClassName, // e.g. SiteTree has ID, not DataObject
					'definedOnClass' => $className,
				),
			);
			$r = array_merge($always, $r);
		}else{
			$reflectionClass = new ReflectionClass($className);
			$parentClassName = $reflectionClass->getParentClass()->getName();
			$r = array_merge($r, self::getDataObjectFields($parentClassName, $className));
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


	public static function getClassPluralName($className){
		if(isset(self::$missing_plural_name_map[$className])){
			return self::$missing_plural_name_map[$className];
		}
		$obj = new $className();
		return $obj->plural_name();
	}

	
}