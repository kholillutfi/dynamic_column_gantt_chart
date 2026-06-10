odoo.define('dynamic_column_gantt_chart.dynamic_gantt', function (require) {
    "use strict";
    
    var viewRegistry = require('web.view_registry');
    var GanttRow = require('web_gantt.GanttRow');
    var GanttRenderer = require('web_gantt.GanttRenderer');
    var GanttView = require('web_gantt.GanttView');
    var GanttController = require('web_gantt.GanttController');
    var session = require('web.session');

    function formatDate(date,type) {
        const d = date.getDate().toString().padStart(2, '0');        
        const m = (date.getMonth() + 1).toString().padStart(2, '0');
        const y = date.getFullYear();
        
        if (type === 'datetime') {
            const H = date.getHours().toString().padStart(2, '0');
            const M = date.getMinutes().toString().padStart(2, '0');
            const S = date.getSeconds().toString().padStart(2, '0');

            return `${d}/${m}/${y} ${H}:${M}:${S}`;
        } else {
            return `${d}/${m}/${y}`;
        }
    
    }

    function findGroupById(rows, id) {
        for (const row of rows) {
            if (row.id === id) return row;
            if (row.rows && row.rows.length) {
                const found = findGroupById(row.rows, id);
                if (found) return found;
            }
        }
        return null;
    }

    // function setValueGantt(ganttValue,aggregatedPills) {
    //     let res = 0
    //     if (ganttValue.count) {
    //         const field1 = ganttValue.count[0]
    //         const field2 = ganttValue.count[2]
    //         const operator = ganttValue.count[1]

    //         const ops = {
    //             '+': (a, b) => a + b,
    //             '-': (a, b) => a - b,
    //             '*': (a, b) => a * b,
    //             '/': (a, b) => b > 0 ? a / b : 0
    //         };
    //         const fn = ops[operator] || ops['+'];
    //         const fieldAgg = aggregatedPills
    //                             .map(i => ({mo: i.display_name, [field1]: i[field1], [field2]: i[field2], result: Math.ceil(fn(i[field1], i[field2]))}))
    //         console.log(fieldAgg)
    //         res = aggregatedPills
    //             .reduce((acc,val) => acc + Math.ceil(fn(val[field1], val[field2])), 0);
    //         console.log(res)
    //         } else if (ganttValue.normal) {
    //             res = aggregatedPills.reduce((acc,val) => acc + val[ganttValue.normal], 0) 
    //         }

    //     return isNaN(res) ? 0 : res;
    // }

    // region set value gantt
    function setValueGantt(ganttValue,aggregatedPills) {
        let resFields = []
        ganttValue.forEach(field => {
            let displayName = field
            if (typeof field === "object") {
                let sumTotal = aggregatedPills.reduce((acc, val) => acc + val[field.name], 0);

                if (typeof field.view_option === 'boolean' && field.view_option === true) {
                    displayName = `${Math.ceil(sumTotal)}${field.label}`;
                } else if (typeof field.view_option === 'number') {
                    displayName = `${sumTotal.toFixed(field.view_option)}${field.label}`;
                } else {
                    displayName = `${sumTotal}${field.label}`;
                }
            }
            resFields.push(displayName); 
        })
        return resFields.join(' / ')
    }
    
    var GantRowCustomize = GanttRow.extend({
        init: function (parent, pillsInfo, viewInfo, options) {
            this._super.apply(this, arguments);
            var self = this;
    
            this.modelName = parent.__parentedParent?.modelName ?? false;
            
            this.fieldImage = this.options.fieldImage;
            this.imageUrl = false
            
            if (this.fieldImage && !this.isGroup && this.pills[0]) {
                this.imageUrl = session.url('/web/image', {
                    model: this.modelName,
                    id: this.pills[0]['id'],
                    field: this.fieldImage.attrs.name,
                });
            }

        },
        _aggregateGroupedPills: function () {
            //region aggregate Group Row
            this._super.apply(this, arguments);
            var self = this;
            const fieldValGantt = this.options.fieldValueGantt
            // console.log(this.name);

            // region field value gantt
            if (fieldValGantt.length && this.isGroup) {
                // console.log(this.pills);
                const seenIds = new Set();
                const listData = [];
                let resultAgg = [];
                
                for (let i = this.pills.length - 1; i >= 0; i--) {
                    if (self.consolidate && self.consolidationParams.maxValue) return;
                    
                    const group = this.pills[i];
                    const newAgg = [];
        
                    for (const item of group.aggregatedPills) {
                        if (!seenIds.has(item.id)) {
                            newAgg.push(item);
                            listData.push(item);
                            seenIds.add(item.id);
                        }
                    }
                    resultAgg.push({aggregatedPills: newAgg, 
                                    consolidated: true, 
                                    count: group.count, 
                                    display_name: setValueGantt(fieldValGantt,newAgg), 
                                    id: group.id, 
                                    leftMargin: group.leftMargin,
                                    startDate: group.startDate,
                                    stopDate: group.stopDate,
                                    style: group.style,
                                    topPadding: group.topPadding,
                                    width: group.width
                                });
                }
                resultAgg.reverse();
                this.pills = resultAgg
                
                // if (['year'].includes(this.state.scale)) {
                //     if (this.groupedByField === this.state.groupedBy[0]) {
                //         const newPills = []
                //         for (const date of this.viewInfo.slots) {
                //             const interval = this.SCALES[this.state.scale].interval
                //             const dateEnd = date.clone().endOf(interval);
                //             const aggPills = listData.filter(i =>
                //                 i.stopDate.isBetween(date, dateEnd, undefined, '[]')
                //             );
                //             newPills.push({aggregatedPills: aggPills, 
                //                             consolidated: true, 
                //                             count: 0, 
                //                             display_name: setValueGantt(fieldValGantt, aggPills), 
                //                             id: 0, 
                //                             leftMargin: false,
                //                             startDate: date,
                //                             stopDate: dateEnd,
                //                             style: false,
                //                             topPadding: 0,
                //                             width: '100%'
                //                         })
                //         }
                //         this.pills = newPills
                //     } else if (this.groupedByField === this.state.groupedBy[1]) {
                //         if (this.pills.length > 0) {
                //             const startDate = this.pills[0].startDate
                //             const endDate = this.pills[this.pills.length - 1].stopDate
    
                //             const newPills = [{aggregatedPills: listData, 
                //                                consolidated: true, 
                //                                count: 0, 
                //                                display_name: setValueGantt(fieldValGantt, listData), 
                //                                id: 0, 
                //                                leftMargin: false,
                //                                startDate: startDate,
                //                                stopDate: endDate,
                //                                style: false,
                //                                topPadding: 0,
                //                                width: '100%'
                //                             }]

                //             this.pills = newPills
                //         }
                //     } else if (this.groupedByField === this.state.groupedBy[2]) {
                //         if (this.pills.length > 0) {
                //             const startDate = this.pills[0].startDate
                //             const endDate = this.pills[this.pills.length - 1].stopDate
    
                //             const newPills = [{aggregatedPills: listData, 
                //                                consolidated: true, 
                //                                count: 0, 
                //                                display_name: setValueGantt(fieldValGantt, listData), 
                //                                id: 0, 
                //                                leftMargin: false,
                //                                startDate: startDate,
                //                                stopDate: endDate,
                //                                style: false,
                //                                topPadding: 0,
                //                                width: '100%'
                //                             }]

                //             this.pills = newPills
                //         }
                //     }
                // }

                // this.pills.forEach(function (pill) {
                //     pill.consolidated = true;
                //     if (self.consolidate && self.consolidationParams.maxValue) return;
                //     let pillAgg = pill.aggregatedPills
                //     if (pillAgg.length > pill.count) {
                //         pillAgg = pillAgg.slice(0, pill.count);
                //     }

                //     const ganttValue = setValueGantt(fieldValGantt,pillAgg)
                //     pill.display_name = ganttValue;
                // });
            }
        },

        // render fields
        renderElement: function () {
            this._super.apply(this, arguments);

            const fieldShow = this.options.fieldShow;
            const fieldName = this.fieldsInfo
            const unitOfWidth = 1.041666667

            // console.log(this.name);
            // console.log(this.slots);

            fieldShow.forEach(field => {
                
                let resValue = []
                let CalculateNumber = 0
                
                if (!this.isGroup) {
                    const valueCheck = this.pills.map(c => c[field.attrs.name])
                    // console.log(this.pills)
                    valueCheck.forEach(val => {
                        if (['float','integer'].includes(fieldName[field.attrs.name].type)) {
                            CalculateNumber+=val
                        } else if (fieldName[field.attrs.name].type === 'char') {
                            resValue.push(val)
                        } else if (['datetime','date'].includes(fieldName[field.attrs.name].type)) {
                            resValue.push(val._d ? formatDate(val._d,fieldName[field.attrs.name].type):'')
                        } else if (fieldName[field.attrs.name].type === 'many2one') {
                            resValue.push(val[1])
                        } else if (fieldName[field.attrs.name].type === 'selection') {
                            let text = val;
                            let result = text.split(" ")
                                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                .join(" ");
                            resValue.push(result)
                        }
                    });
                }

                let value = ''
                
                if (['float','integer'].includes(fieldName[field.attrs.name].type) && field.attrs.name != 'id') {
                    const decimal = field.attrs.decimal || 0
                    const rounded = field.attrs.rounded || false
                    if (this.isGroup) {
                        // console.log(this.name);
                        let countValueGroup = 0
                        try {
                            const groupLine = findGroupById(this.state.rows,this.rowId) 
                            //region total Row Group
                            // console.log(groupLine);
                            if (!groupLine && this.isTotal) {
                                const ListTotalGroup = this.state.rows.map(p => 
                                    p.records
                                        .reduce(
                                            (acc, val) => acc + val[field.attrs.name], 0
                                        )
                                ).flat();
                                // console.log(`Total ${field.attrs.name}`, ListTotalGroup)
                                countValueGroup = ListTotalGroup.reduce(
                                    (acc, val) => acc + val,
                                    0
                                );

                            } else {
                                countValueGroup = groupLine.records.reduce(
                                    (acc, val) => acc + val[field.attrs.name],
                                    0
                                );
                            }
                            
                            } catch(e) {
                                console.log(e);
                            }
                            
                        if (fieldName[field.attrs.name].type === 'float' && decimal > 0) {
                            value = countValueGroup.toFixed(decimal)
                        } else if (fieldName[field.attrs.name].type === 'float' && rounded) {
                            value = Math.ceil(countValueGroup);
                        } else {
                            value = countValueGroup
                        }

                    } else {
                        if (fieldName[field.attrs.name].type === 'float' && decimal > 0) {
                            value = CalculateNumber.toFixed(decimal)
                        } else if (fieldName[field.attrs.name].type === 'float' && rounded) {
                            value = Math.ceil(CalculateNumber);
                        } else {
                            value = CalculateNumber;
                        }
                    }

                } else if (!this.isGroup){
                    const uniqueDict = new Set(resValue);
                    const uniqueList = [...uniqueDict];
                    value = uniqueList.join(', \n')
                }

                const fieldCol = field.attrs.col || 1
                const fieldWidth = field.attrs.width || 0
                const fieldAlign = field.attrs['content-align'] || 'center'
                
                const colEl = fieldWidth === 0 ? ` col-${fieldCol}`: ''
                const widthEl = fieldWidth > 0 ? ` max-width: ${unitOfWidth * fieldWidth}%; flex: 0 0 ${unitOfWidth * fieldWidth}%;`: ''
                
                var $customCol = $('<div>', {
                    class: 'additional-column-row o_gantt_row_sidebar d-flex align-items-center pl-2 pr-2' + colEl,
                    style: this.isGroup ? widthEl : 'border-left: 1px solid #ccc; line-height: 31px;' + widthEl,
                });
                
                var textCol = $('<span>', {
                    class: `w-100 text-${fieldAlign}`,
                    text: value
                });
                
                $customCol.append(textCol);

                
                
                this.$('.o_gantt_slots_container').before($customCol);
            });
            
            
            if (this.fieldImage && fieldName[this.fieldImage.attrs.name].type === 'binary') {
                const rowTitle = this.$('.o_gantt_row_title')
                const firstColumnRow = rowTitle.parent()
                
                const width = this.fieldImage.attrs.width || 4
                const Parentwidth = this.fieldImage.attrs['parent-width'] || 16

                const widthCol = (unitOfWidth * width) + (unitOfWidth * Parentwidth) //16.66666667
                
                if (!this.isGroup) {
                    rowTitle.removeClass("text-truncate");

                    const widthEl = width > 0 ? ` max-width: ${unitOfWidth * width}%; flex: 0 0 ${unitOfWidth * width}%;`: ''
                    var $customColImg = $('<div>', {
                        class: 'additional-column-img col-1 pt-2 pb-2',
                        style: 'border-right: 1px solid #ccc; display: flex; justify-content: center; align-items: center;' + widthEl,
                    });
                    //region render img row
                    try {
                        if (this.imageUrl) {
                            var $img = $('<img>', {
                                src: this.imageUrl,
                                style: 'max-width: 90%; border: 1px solid #ccc'
                            });
    
                            $customColImg.append($img);
                            // console.log('get image bawaan');
                        } else {
                            const imgBase64 = this.pills[0][this.fieldImage.attrs.name]
                            
                            if (imgBase64) {
                                var $imgRenderer = $('<img>', {
                                    src: 'data:image/png;base64,' + imgBase64,
                                    style: 'max-width: 90%; border: 1px solid #ccc'
                                });
                                $customColImg.append($imgRenderer);
                                // console.log('render image sendiri');
                            }
                        }
                    } catch (error) {
                        console.log(error)
                    }

                    firstColumnRow.before($customColImg);
                    
                    //region parent col & align
                    const parentContentAlign = this.fieldImage.attrs['parent-content-align'] || 'left'
                    firstColumnRow.addClass('d-flex align-items-center pl-2 pr-2')
                    rowTitle.addClass(`w-100 text-${parentContentAlign}`)
                    
                    firstColumnRow.css({'padding-left': 0,'max-width': `${unitOfWidth * Parentwidth}%`,'flex':`0 0 ${unitOfWidth * Parentwidth}%`})
                } 
                else {
                    firstColumnRow.css({'max-width': `${widthCol}%`,'flex':`0 0 ${widthCol}%`})
                }
            }

        },

        //     rowTitle.addClass("mt-2 mb-2"); 
        //     const thumbnails = this.$('.o_gantt_row_thumbnail_wrapper').find('.o_gantt_row_thumbnail')
        //     thumbnails.removeClass("rounded-circle");
        //     thumbnails.css({
        //         border: "1px solid #ced4da",
        //         'min-height': `${thumbnailSize}px`,
        //         'max-height': `${thumbnailSize}px`,
        //         'object-fit': 'cover',
        //     });
    });
    
    var GanttRendererCustomize = GanttRenderer.extend({
        config: _.extend({}, GanttRenderer.prototype.config, {
            GanttRow: GantRowCustomize,
        }),
        init: function (parent, state, params) {
            var self = this;
            this._super.apply(this, arguments); 

            this.fields = this.arch.children.filter(c => c.tag === "field" && c.attrs.optional === 'show')
            this.fieldShow = this.fields.filter(c => !c.attrs.widget)
            this.fieldImage = this.fields.filter(c => c.attrs.widget === 'image')[0]

            const precisionStr = params.arch.attrs.precision
            this.displayValueGantt = []
            //region precision 
            if (precisionStr) {
                let precStr = precisionStr.replace(/'/g, '"')
                let precObj = JSON.parse(precStr);

                if (precObj.display_value_gantt?.length){
                    let fieldsInView = this.arch.children.map(i => i.attrs.name)
                    
                    const fieldValueGantt = precObj.display_value_gantt.map(i => fieldsInView.includes(i.field) && ['float','integer'].includes(this.fieldsInfo[i.field].type) ? {name: i.field, label: i.label, view_option: i.rounded || i.decimal || false} : 'Failed!')
                    // console.log(fieldValueGantt)
                    this.displayValueGantt = fieldValueGantt
                }
            }
        },

        _renderView: function () {
            return this._super.apply(this, arguments).then(() => {
                const fields = this.state.fields
                const unitOfWidth = 1.041666667
                const unitOfCol = 8.333333336

                let $headerContainer = this.$('.o_gantt_header_container');
                
                if (this.fieldShow.length > 0) {
                    let columnHeader = {column: 0, index: 0}
                    this.fieldShow.forEach((field,i,arr) => {

                        if (field.attrs['merge-header']) {
                            // region merge column
                            let groupStr = field.attrs['merge-header'].replace(/'/g, '"')
                            let groupObj = JSON.parse(groupStr);
                            columnHeader = {column: groupObj.column, index: i+groupObj.column}
                            
                            let fieldColTotal = 0
                            let $bottom = $('<div>', {
                                style: 'display: flex; justify-content: space-between; width: 100%;'
                            });

                            for (let ic = 0 ;ic <= columnHeader.column; ic++) {
                                const fieldCol = arr[ic+i]
                                const width = parseInt(fieldCol.attrs.width) || parseInt(fieldCol.attrs.col) * unitOfCol || unitOfCol
                                fieldColTotal += width
                                
                                // const widthEl = ` max-width: ${unitOfWidth * width}%; flex: 0 0 ${unitOfWidth * width}%;`
                                const borderLeft = field.attrs.name === fieldCol.attrs.name ? '' : 'border-left: 1px solid #ccc;'
                                
                                let $fieldBottom = $('<div>', {
                                        text: fieldCol.attrs.string || fields[fieldCol.attrs.name].string,
                                        class: 'additional-column-header-group-child o_gantt_row_sidebar text-center',
                                        style: borderLeft + ` width: ${100/(columnHeader.column+1)}%;`
                                    })
                                $bottom.append($fieldBottom);
                            }

                            if (fieldColTotal > 1) {
                                // console.log(fieldColTotal)
                                const widthEl = ` max-width: ${unitOfWidth * fieldColTotal}%; flex: 0 0 ${unitOfWidth * fieldColTotal}%;`

                                let $custom = $('<div>', {
                                    class: 'additional-column-header-group',
                                    style: 'border-left: 1px solid #ccc;' + widthEl,
                                });
                                
                                let $top = $('<div>', {
                                    text: groupObj.string,
                                    class: 'o_gantt_row_sidebar text-center',
                                });

                                $custom.append($top, $bottom);
                                $headerContainer.find('.o_gantt_header_slots').before($custom);
                            }

                        }

                        if (columnHeader.column === 0) {
                            const col = field.attrs.col || 1
                            const width = field.attrs.width || 0
                            
                            const colEl = width === 0 ? ` col-${col}`: ''
                            const widthEl = width > 0 ? ` max-width: ${unitOfWidth * width}%; flex: 0 0 ${unitOfWidth * width}%;`: ''
                            
                            let $custom = $('<div>', {
                                class: 'additional-column-header text-center o_gantt_row_sidebar' + colEl,
                                text: field.attrs.string || fields[field.attrs.name].string,
                                style: 'border-left: 1px solid #ccc; font-weight: bold;' + widthEl,
                            });
                            $headerContainer.find('.o_gantt_header_slots').before($custom);
                        }

                        if (columnHeader.index === i) {
                            columnHeader = {column: 0, index: 0}
                        }
                    });
                }
                //region custom coll exist img
                if (this.fieldImage && this.fieldsInfo[this.fieldImage.attrs.name].type === 'binary') {
                    const firstColumn = $headerContainer.find('.o_gantt_row_sidebar').first()
                    const width = this.fieldImage.attrs.width || 4
                    const Parentwidth = this.fieldImage.attrs['parent-width'] || 16

                    if (width > 0) {
                        const widthCol = (unitOfWidth * width) + (unitOfWidth * Parentwidth)
                        firstColumn.css({'max-width': `${widthCol}%`,'flex':`0 0 ${widthCol}%`})
                    }
                }
                
                let totalContainer = this.$('.o_gantt_total_row_container');
                let totalRowFirst = totalContainer.find('.o_gantt_row_sidebar').first()
                
                // region redesign total tabel
                totalRowFirst.addClass('d-flex align-items-center border-right');
                totalRowFirst.find('.o_gantt_row_title')
                        .removeClass('text-right')
                        .addClass('text-center w-100');
                        
                // height total value
                // this.$('.o_gantt_cell')
                //     .addClass('pt-4')
                //     .css({'height': '67px'})
            });
        },

        _renderRow: function (pillsInfo, params) {
            params = _.extend({}, params, { fieldShow: this.fieldShow, fieldImage: this.fieldImage, fieldValueGantt: this.displayValueGantt});
            return this._super(pillsInfo, params);
        }
    });
    
    var GanttControllerCustomize = GanttController.extend({
        init: function (parent, model, renderer, params) {
            this._super.apply(this, arguments);
            
            let collapseGroup = renderer.arch.attrs?.default_collapse_group 
            if (collapseGroup) {
                let collapsGroupStr = collapseGroup.replace(/'/g, '"')
                collapseGroup = JSON.parse(collapsGroupStr);
            }
            this.defaultCollapseGroup = collapseGroup
        },
        // region default all close group
        async on_attach_callback() {
            this._super.apply(this, arguments);

            const collapseGroupRows = Object.values(this.model.allRows).filter(row => row.isGroup && (this.defaultCollapseGroup && this.defaultCollapseGroup.includes(row.groupedByField)));
            
            collapseGroupRows.forEach(row => {
                this.model.collapseRow(row.id);
                this.renderer.updateRow(this.model.get(row.id)); 
            });

            console.log('default close all group...')
        },

        async update(params = {}, options = {}) {
            console.log('update...')
            if (options.fromExpandClick || options.fromCollapsClick) {
                return this._super(params, options);
            }
            
            const result = await this._super(...arguments);
            try {
                const groupRows = Object.values(this.model.allRows).filter(row => row.isGroup);
                groupRows.forEach(row => {
                    console.log(row);
                    this.model.collapseRow(row.id);
                    this.renderer.updateRow(this.model.get(row.id)); 
                })
                console.log('close all group...')
            } catch (error) {
                console.log(error)
            }
            return result
        },

        // open group
        _onExpandClicked: function (ev) {
            ev.preventDefault();
            this.model.expandRows();
            this.update({}, { reload: false, fromExpandClick: true });
        },

        // close group
        _onCollapseClicked: function (ev) {
            ev.preventDefault();
            this.model.collapseRows();
            this.update({}, { reload: false, fromCollapsClick: true });
        },

        });

    var GanttViewCustomize = GanttView.extend({
        config: _.extend({}, GanttView.prototype.config, {
            Controller: GanttControllerCustomize,
            Renderer: GanttRendererCustomize
        }),
    });

    viewRegistry.add('dynamic_gantt', GanttViewCustomize);
    console.log('loaded dynamic gantt');
});



