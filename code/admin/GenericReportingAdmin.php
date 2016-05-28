<?php


class GenericReportingAdmin extends LeftAndMain {


	private static $url_segment = 'reporting';

	private static $url_rule = '/$Action/$ID';

	private static $menu_title = 'Reporting';

	private static $allowed_actions = array(
		'index',
		'newReport',
		'view',
	);


	protected $report = null;


	public function init(){
		parent::init();

		$request = $this->getRequest();
		/* @var $request SS_HTTPRequest */
		if($request->param('Action') == 'view'){
			$id = $request->param('ID');
			if(!$id){
				return $this->httpError(400, 'Parameter ID required');
			}
			$report = GenericReport::get()->byId($id);
			if($report->exists()){
				$this->report = $report;
				// $this->getResponseNegotiator()->setCallback('CurrentForm', function() use(&$controller) {
				// 	return $this->view($request);
				// });
			}else{
				return $this->httpError(404, 'Report with ID: '.$id.' not found');
			}
		}

		// $this->Breadcrumbs();

		Requirements::javascript('framework/thirdparty/jquery/jquery.js');
		Requirements::javascript('genericreporting/javascript/angular.js');
		Requirements::javascript('genericreporting/javascript/query-builder.standalone.min.js');
		Requirements::javascript('genericreporting/javascript/genericreporting.js');
	}

	public function newReport(){
		return $this;
	}

	public function view($request){
		return $this;//->renderWith('GenericReport_View');
	}

	public function getEditForm(){
		return parent::getEditForm();

		// list
		$fields = new FieldList();
		$gridFieldConfig = GridFieldConfig::create()->addComponents(
			//new GridFieldAddNewButton(),
			new GridFieldToolbarHeader(),
			new GridFieldSortableHeader(),
			new GridFieldDataColumns(),
			new GridFieldFooter()
		);
		$gridField = new GridField('Reports', false, $this->Reports(), $gridFieldConfig);
		$columns = $gridField->getConfig()->getComponentByType('GridFieldDataColumns');
		// $columns->setDisplayFields(array(
		// 	'title' => _t('ReportAdmin.ReportTitle', 'Title'),
		// ));

		$columns->setFieldFormatting(array(
			'Title' => '<a href=\"$Link\" class=\"cms-panel-link\">$value ($Link)</a>'
		));
		$gridField->addExtraClass('all-reports-gridfield');
		$fields->push($gridField);

		$fields->push(new LiteralField('NewReport', '<a href="'.$this->Link('newReport').'">new</a>'));

		$actions = new FieldList();


		$form = CMSForm::create(
			$this,
			'EditForm',
			$fields,
			$actions
		);

		$form->setHTMLID('Form_EditForm');
		// JS and CSS use this identifier
		
// $t = $this->getTemplatesWithSuffix('_EditForm');
// die('t<pre>'.print_r($t, true));

		$form->setTemplate($this->getTemplatesWithSuffix('_EditForm'));

		$form->addExtraClass('cms-edit-form cms-panel-padded center ' . $this->BaseCSSClasses());
		$form->loadDataFrom($this->request->getVars());

		$this->extend('updateEditForm', $form);
		return $form;
	}





	public function Reports(){
		return GenericReport::get();
	}

	public static function getAllReportsLink(){
		return Controller::join_links(
			'/admin/',
			self::$url_segment,
			'/'
		);
	}

	public static function getViewReportLink($id){
		return Controller::join_links(
			self::getAllReportsLink(),
			'view/',
			$id
		);
	}

	public function Content(){
		return $this->renderWith('GenericReport_View');
	}

	public function Breadcrumbs($unlinked = false) {
		$items = parent::Breadcrumbs($unlinked);
		
		// The root element should explicitly point to the root node.
		// Uses session state for current record otherwise.
		$items[0]->Link = self::getAllReportsLink();

		if ($this->report) {
			//build breadcrumb trail to the current report
			$items->push(new ArrayData(array(
				'Title' => $this->report->Title,
				'Link' => self::getViewReportLink($this->report->ID),
			)));
		}

		return $items;
	}

}