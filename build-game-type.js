var GridLayout = require("ui/layouts/grid-layout");
var ImageModule = require("ui/image");
var btnModule = require('ui/button');
var enums = require("ui/enums");
var storage = require('../storage');
var universal_code = require('../universal-code');
var build_rathers = require('./build-rather.js');
var popups = require('./build-popup');
var isPopupInView = false;
var StackLayout = require("ui/layouts/stack-layout");
var gridlayout = new GridLayout.GridLayout();

var layout;
var viewModel;
var left;
var right;

function detect_game_type_and_build(stacklayout, vm) {

    return new Promise(function (resolve, reject) {

        var firstRow = new GridLayout.ItemSpec(1, GridLayout.GridUnitType.auto);
        var firstColumn = new GridLayout.ItemSpec(1, GridLayout.GridUnitType.star);
        var secondColumn = new GridLayout.ItemSpec(1, GridLayout.GridUnitType.star);
        var currentLevel = storage.getCurrentLevel();

        isPopupInView = false;
        
        left = undefined;
        right = undefined;

        if (!layout || !viewModel) {

            layout = stacklayout

            viewModel = vm;

        } else {

            stacklayout = layout;

            vm = viewModel;

        }

        for (var levelId in currentLevel) {

            if (currentLevel[levelId].type === 'image') {

                for (var ratherKey in currentLevel[levelId]) {

                    if (ratherKey === 'answered' || ratherKey === 'type') continue;

                    for (var key in currentLevel[levelId][ratherKey]) {

                        if (!left) {


                            left = new ImageModule.Image();

                            left.className = 'left level-image';

                            left.pseudoid = ratherKey;

                            left.src = currentLevel[levelId][ratherKey]['false'];

                            continue;

                        }

                        right = new ImageModule.Image();

                        right.className = 'right level-image';

                        right.pseudoid = ratherKey;

                        right.src = currentLevel[levelId][ratherKey]['false'];

                    }

                }

            }


            if (currentLevel[levelId].type === 'text') {
                
                for (var ratherKey in currentLevel[levelId]) {

                    if (ratherKey === 'answered' || ratherKey === 'type') continue;

                    for (var l in currentLevel[levelId][ratherKey]) {

                        if (currentLevel[levelId][ratherKey]) {

                            if (!left) {

                                left = new btnModule.Button();

                                left.className = 'left';

                                left.pseudoid = ratherKey;
                                
                                left.text = currentLevel[levelId][ratherKey]['false'];

                                left.backgroundColor = 'red';

                                left.className = 'btn btn-active';

                                continue;
                            }

                            right = new btnModule.Button();

                            right.className = 'right';

                            right.pseudoid = ratherKey;

                            right.text = currentLevel[levelId][ratherKey]['false'];

                            right.backgroundColor = 'blue';

                            right.className = 'btn btn-active';

                        }

                    }

                }

            }


            // gridlayout.hasLayout = true;

            left.addEventListener('tap', selected, this);

            right.addEventListener('tap', selected, this);

            // gridlayout.addRow(firstRow);

            // GridLayout.GridLayout.setColumn(left, 0);

            // GridLayout.GridLayout.setColumn(right, 1);

            // GridLayout.GridLayout.setRow(left, 0);

            // GridLayout.GridLayout.setRow(right, 0);

            // gridlayout.addColumn(firstColumn);

            // gridlayout.addColumn(secondColumn);

            // gridlayout.addChild(left);

            // gridlayout.addChild(right);

            stacklayout.hasLayout = true;

            stacklayout.addChild(left);

            stacklayout.addChild(right);


        }

        // stacklayout.addChild(gridlayout);

        resolve(true);

    });
};


function selected(event) {
    if (isPopupInView) return;
    var btnText = event.object.text;
    var pseudoid = event.object.pseudoid;
    var potentials = storage.getPotentials();
    var currentPerson = potentials.getItem(0);
    var currentLevel = storage.getCurrentLevel();

    var person = universal_code.compare_selected(currentPerson, pseudoid);

    if (!person.answer) person.answer = '';

    var strikes = viewModel.get('lbl' + person.id).text += person.answer + ' ';

    storage.saveAnsweredLevels(pseudoid);

    universal_code.set_current_level();
    // universal_code.send_results(pseudoid, currentLevel, me.id);


    universal_code.twoOutOfThreeHelper(strikes).then(function (type) {

        switch (type) {

            case 'reconcile':

                build_rathers.animate_off_screen({ x: -300, y: 0 }).then(function (value) {

                    isPopupInView = true;

                    popups.build_reconcile_popup(person).then(function (popupGrid) {

                        isPopupInView = false;

                        // checkExistingGridsOnParentGrid(popupGrid, person.id);
                        // listenForPopupRemoval(popupGrid, person.id);

                    });

                });



                break;


            case 'closeenough':



                build_rathers.animate_off_screen({ x: 300, y: 0 }).then(function (value) {

                    isPopupInView = true;

                    popups.build_close_enough_popup(person).then(function (popupGrid) {

                        isPopupInView = false;

                    });

                    // layout.addChild(popupGrid);

                });



                // layout.className = 'darken';
                // checkExistingGridsOnParentGrid(popupGrid, person.id);
                // listenForPopupRemoval(popupGrid, person.id);

                // build_rathers.remove_and_add_person(potentials, person, waitingList, viewModel);



                break;

            case 'match':

                //     popups.build_match_popup(person).then(function (popupGrid) {



                build_rathers.animate_off_screen({ x: 500, y: 0 }).then(function (value) {

                    isPopupInView = true;

                    popups.build_close_enough_popup(person).then(function (popupGrid) {

                        isPopupInView = false;

                    });


                });
                //         // checkExistingGridsOnParentGrid(popupGrid, person.id);
                //         // listenForPopupRemoval(popupGrid, person.id);

                //     });

                break;

            case 'nomatch':

                detect_game_type_and_build();

                break;
        }

    });


    //     });
    // });

    removeCurrentLevel(); // buttons/images/potential currently able to select



}


function checkExistingGridsOnParentGrid() {

    if (popupGridWaitingList.length < 2) {

        parentGridlayout.addChild(popupGridWaitingList[0]);

    }

}

function removeCurrentLevel() { // buttons/images/potential currently able to select

    layout.removeChild(left);

    layout.removeChild(right);

    // layout._eachChildView(function (arg) {
        
    //     if (arg && arg.hasLayout) {

    //         arg.removeChild(left);

    //         arg.removeChild(right);

    //         gridlayout.removeColumns();

    //         gridlayout.removeRows();

    //         layout.removeChild(arg);

    //     }

    // });

}




exports.detect_game_type_and_build = detect_game_type_and_build;