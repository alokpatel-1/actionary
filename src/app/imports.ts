import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { AccordionModule } from "primeng/accordion";
import { AutoComplete } from "primeng/autocomplete";
import { AutoFocusModule } from "primeng/autofocus";
import { AvatarModule } from "primeng/avatar";
import { BadgeModule } from "primeng/badge";
import { BreadcrumbModule } from "primeng/breadcrumb";
import { ButtonModule } from "primeng/button";
import { CalendarModule } from "primeng/calendar";
import { CardModule } from "primeng/card";
import { Carousel } from "primeng/carousel";
import { CascadeSelect } from "primeng/cascadeselect";
import { Checkbox } from "primeng/checkbox";
import { Chip } from "primeng/chip";
import { ConfirmDialog } from "primeng/confirmdialog";
import { ConfirmPopupModule } from "primeng/confirmpopup";
import { ContextMenuModule } from "primeng/contextmenu";
import { DatePicker } from "primeng/datepicker";
import { Dialog } from "primeng/dialog";
import { DividerModule } from "primeng/divider";
import { DrawerModule } from "primeng/drawer";
import { IconField } from "primeng/iconfield";
import { InputGroup } from "primeng/inputgroup";
import { InputGroupAddonModule } from "primeng/inputgroupaddon";
import { InputIcon } from "primeng/inputicon";
import { InputMask } from "primeng/inputmask";
import { InputNumber } from "primeng/inputnumber";
import { InputOtp } from "primeng/inputotp";
import { InputSwitchModule } from "primeng/inputswitch";
import { InputTextModule } from "primeng/inputtext";
import { Listbox } from "primeng/listbox";
import { MegaMenuModule } from "primeng/megamenu";
import { MenuModule } from "primeng/menu";
import { MenubarModule } from "primeng/menubar";
import { Message } from "primeng/message";
import { MessagesModule } from "primeng/messages";
import { MultiSelectModule } from "primeng/multiselect";
import { OrderList } from "primeng/orderlist";
import { OverlayPanelModule } from "primeng/overlaypanel";
import { PaginatorModule } from "primeng/paginator";
import { PanelModule } from "primeng/panel";
import { PanelMenuModule } from "primeng/panelmenu";
import { PasswordModule } from "primeng/password";
import { PickList } from "primeng/picklist";
import { Popover } from "primeng/popover";
import { ProgressBar } from "primeng/progressbar";
import { ProgressSpinner } from "primeng/progressspinner";
import { RadioButton } from "primeng/radiobutton";
import { Rating } from "primeng/rating";
import { Scroller } from "primeng/scroller";
import { ScrollPanelModule } from "primeng/scrollpanel";
import { ScrollTop } from "primeng/scrolltop";
import { Select } from "primeng/select";
import { SelectButton } from "primeng/selectbutton";
import { SidebarModule } from "primeng/sidebar";
import { Skeleton } from "primeng/skeleton";
import { Slider } from "primeng/slider";
import { SplitButton } from "primeng/splitbutton";
import { StepperModule } from "primeng/stepper";
import { StepsModule } from "primeng/steps";
import { TableModule } from "primeng/table";
import { TabMenuModule } from "primeng/tabmenu";
import { TabViewModule } from "primeng/tabview";
import { Tag } from "primeng/tag";
import { TextareaModule } from "primeng/textarea";
import { ToastModule } from "primeng/toast";
import { ToggleButton } from "primeng/togglebutton";
import { ToggleSwitch } from "primeng/toggleswitch";
import { ToolbarModule } from "primeng/toolbar";
import { TooltipModule } from "primeng/tooltip";
import { Tree } from "primeng/tree";
import { TreeSelect } from "primeng/treeselect";
import { TreeTableModule } from "primeng/treetable";
import { FieldsetModule } from 'primeng/fieldset';
import { FloatLabel } from "primeng/floatlabel"


const modules = [
  AvatarModule,
  AccordionModule,
  AutoComplete,
  BadgeModule,
  BreadcrumbModule,
  ButtonModule,
  CalendarModule,
  DatePicker,
  Carousel,
  CascadeSelect,
  Checkbox,
  Chip,
  ConfirmDialog,
  ConfirmPopupModule,
  ContextMenuModule,
  Dialog,
  DividerModule,
  DrawerModule,
  Select,
  InputMask,
  InputSwitchModule,
  InputTextModule,
  TextareaModule,
  InputNumber,
  InputGroup,
  InputGroupAddonModule,
  InputOtp,
  Listbox,
  MegaMenuModule,
  MenuModule,
  MenubarModule,
  Message,
  MessagesModule,
  MultiSelectModule,
  OrderList,
  OverlayPanelModule,
  PaginatorModule,
  PanelModule,
  PanelMenuModule,
  PasswordModule,
  PickList,
  ProgressSpinner,
  ProgressBar,
  RadioButton,
  Rating,
  SelectButton,
  SidebarModule,
  Scroller,
  ScrollPanelModule,
  ScrollTop,
  Skeleton,
  Slider,
  StepperModule,
  SplitButton,
  StepsModule,
  TableModule,
  TabMenuModule,
  TabViewModule,
  Tag,
  ToastModule,
  ToggleButton,
  ToggleSwitch,
  ToolbarModule,
  TooltipModule,
  Tree,
  TreeSelect,
  TreeTableModule,
  CardModule,
  IconField,
  InputIcon,
  AutoFocusModule,
  CommonModule,
  FormsModule,
  ReactiveFormsModule,
  Popover,
  FieldsetModule,
  FloatLabel

  // BrowserModule,
  // BrowserAnimationsModule,
]

@NgModule({
  imports: [
    ...modules
  ],
  exports: [
    ...modules
  ],
  providers: []
})
export class ImportsModule { }
