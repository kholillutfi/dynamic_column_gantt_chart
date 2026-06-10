# Dynamic Column Gantt Chart 
is a custom Odoo 14 Enterprise module that extends the standard Web Gantt View by adding dynamic custom columns and additional display options.
To use the custom features provided by this module, add the following attribute to the <gantt> tag:

js_class="dynamic_gantt"

Example:

<gantt
    js_class="dynamic_gantt"
    date_start="date_planned_start"
    date_stop="date_finish"
    default_group_by="gantt_name"
>
    ...
</gantt>
Features and Attributes

# 1. Add Additional Columns to Gantt View

This is the main feature of the module. You can add extra fields inside the Gantt View as additional columns.

<field name="product_qty" optional="show"/>

The optional="show" attribute allows the column to be shown or hidden by the user.

# 2. Image Column Support

You can display an image field directly inside the Gantt column by using widget="image".

<field name="x_product_img" optional="show" widget="image" col="1"/>

You can also adjust the image column size using width-related attributes.

<field name="x_product_img" optional="show" widget="image" width="5" parent-width="20"/>

# 3. Merge Header Column

You can merge several column headers into one grouped header using merge-header.

<field name="product_qty"
       optional="show"
       width="3"
       string="QTY"
       merge-header="{'column': 1,'string': 'Planned'}"/>

The column key defines how many next columns will be merged under the same header label.

Example:

merge-header="{'column': 1,'string': 'Planned'}"

This means one column after the current column will be grouped under the Planned header.

# 4. Column Width / Column Size

You can adjust the column size using col or width.

<field name="product_id" col="5"/>

Or:

<field name="product_qty" width="3"/>

The col attribute follows the default column sizing behavior. In this module, width is added to provide more specific control when the default col size is too wide or not precise enough.

# 5. Decimal Precision for Float Fields

For float fields, you can control how many decimal digits should be displayed.

<field name="total_volume_planed" decimal="2"/>

Example:

<field name="product_qty" optional="show" width="3" string="QTY" decimal="0"/>
# 6. Content Alignment

You can align column values using content-align.

Available values:

content-align="left"
content-align="center"
content-align="right"

Example:

<field name="product_qty" content-align="right"/>
# 7. Default Collapsed Group

You can set specific group-by columns to be collapsed by default using default_collapse_group.

This attribute is added to the <gantt> tag.

<gantt
    js_class="dynamic_gantt"
    default_collapse_group="['client_order_ref']"
>

The fields listed in default_collapse_group must exist in the Gantt filter group-by options.

# 8. Custom Display Value in Gantt Bar

This module adds support for displaying custom field values inside the Gantt bar using display_value_gantt inside the precision attribute.

precision="{
    'day': 'hour:full',
    'week': 'day:full',
    'month': 'day:full',
    'year': 'day:full',
    'display_value_gantt': [
        {'field':'total_volume_planed','label':'plan','rounded': true},
        {'field':'total_volume_finished','label':'finish','rounded': true}
    ]
}"

The displayed values will be separated by /.

Example result:

23 plan / 24 finish

Attribute explanation:

field: field name to display
label: label text shown after the value
rounded: if true, the value will be rounded
Field Attribute Example

<field name="product_qty"
       optional="show"
       width="3"
       string="QTY"
       decimal="0"
       content-align="right"
       merge-header="{'column': 1,'string': 'Planned'}"/>
       
Full Example
##<record id="manufacture_reporting_gantt_view" model="ir.ui.view">
    <field name="name">manufacture.reporting.gantt.view</field>
    <field name="model">mrp.production</field>
    <field name="arch" type="xml">
        <gantt
            js_class="dynamic_gantt"
            disable_drag_drop="1"
            total_row="true"
            plan="0"
            delete="0"
            create="0"
            cell_create="0"
            color="state_id"
            string="Gantt Manufacture"
            precision="{'day': 'hour:full', 'week': 'day:full', 'month': 'day:full', 'year': 'day:full', 'display_value_gantt': [{'field':'total_volume_planed','label':'m3','rounded': true},{'field':'total_volume_finished','label':'m3','rounded': true}]}"
            date_start="date_planned_start"
            date_stop="date_finish"
            default_group_by="gantt_name"
            default_scale="year"
            decoration-info="state == 'draft'"
            decoration-warning="state in ('confirmed', 'progress', 'to_close')"
            decoration-success="state == 'done'"
            decoration-danger="state == 'cancel'"
            default_collapse_group="['client_order_ref']"
        >

            <field name="gantt_name"/>
            <field name="state"/>
            <field name="product_qty"/>
            <field name="sale_comments"/>
            <field name="sale_fabric_attributes"/>

            <field name="x_product_img" optional="show" widget="image" width="5" parent-width="20"/>
            <field name="product_id" col="5" content-align="center"/>
            <field name="product_qty" optional="show" width="3" string="QTY" decimal="0" content-align="right" merge-header="{'column': 1,'string': 'Planned'}"/>
            <field name="total_volume_planed" optional="show" width="3" string="m3" rounded="true" content-align="right"/>
            <field name="qty_producing" optional="show" width="3" string="QTY" decimal="0" merge-header="{'column': 1,'string': 'Finished'}" content-align="right"/>
            <field name="total_volume_finished" optional="show" width="3" string="m3" rounded="true" content-align="right"/>
            <field name="qty_outstand" optional="show" width="3" string="QTY" decimal="0" merge-header="{'column': 1,'string': 'Outstand'}" content-align="right"/>
            <field name="vol_outstand" optional="show" width="3" string="m3" rounded="true" content-align="right"/>

            <templates>
                <div t-name="gantt-popover" class="container-fluid">
                    <div class="row no-gutters">
                        <div class="col">
                            <ul class="pl-1 mb-0 list-unstyled">
                                <li><strong>Name: </strong> <t t-esc="gantt_name"/></li>
                                <li><strong>Start Date: </strong> <t t-esc="userTimezoneStartDate.format('L')"/></li>
                                <li><strong>Stop Date: </strong> <t t-esc="userTimezoneStopDate.format('L')"/></li>
                                <li><strong>Quantity Plan: </strong> <t t-esc="product_qty"/> unit</li>
                                <li><strong>Status: </strong> <t t-esc="state"/></li>
                                <li t-if="sale_comments"><strong>OD Comments: </strong> <t t-esc="sale_comments"/></li>
                                <li t-if="sale_fabric_attributes"><strong>Fabric Attribute: </strong> <t t-esc="sale_fabric_attributes"/></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </templates>
        </gantt>
    </field>
</record>
