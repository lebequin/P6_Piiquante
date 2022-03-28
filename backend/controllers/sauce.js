const Sauce = require('../models/sauce');
const utils = require('../utils');
const fs = require('fs');

exports.createSauce = (req, res, next) => {
    const sauceObject = JSON.parse(req.body.sauce);
    delete sauceObject._id;
    const sauce = new Sauce({
        ...sauceObject,
        likes: 0,
        dislikes: 0,
        usersDisliked: [],
        usersLiked: [],
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    });
    sauce.save()
        .then(() => res.status(201).json({ message: 'Objet enregistré !'}))
        .catch(error => res.status(400).json({ error }));
};


exports.getOneSauce = (req, res, next) => {
    Sauce.findOne({
        _id: req.params.id
    }).then(
        (sauce) => {
            res.status(200).json(sauce);
        }
    ).catch(
        (error) => {
            res.status(404).json({
                error: error
            });
        }
    );
};

exports.modifySauce = (req, res, next) => {
    const headerAuth = req.headers["authorization"];
    const userId = utils.getUserId(headerAuth);

    if( userId == req.params.id ) {
        if(req.file){
            Sauce.findOne({ _id: req.params.id }).then(sauce => {
                const filename = sauce.imageUrl.split('/images/')[1];
                fs.unlink(`images/${filename}`, () => {
                    const sauceObject = {
                        ...JSON.parse(req.body.sauce),
                        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
                    }
                    Sauce.updateOne({_id: req.params.id}, {...sauceObject, _id: req.params.id})
                        .then(() => res.status(200).json({message: 'Objet modifié !'}))
                        .catch(error => res.status(400).json({error}));
                });
            })
                .catch(error => res.status(500).json({ error }));
        }
        else {
            Sauce.updateOne({ _id: req.params.id }, { ...req.body, _id: req.params.id })
                .then(() => res.status(200).json({ message: 'Objet modifié !'}))
                .catch(error => res.status(400).json({ error }));
        }
    }
    else{
        res.status(401).send('You are not authenticated to modify this sauce')
    }
};

exports.deleteSauce = (req, res, next) => {
    const headerAuth = req.headers["authorization"];
    const userId = utils.getUserId(headerAuth);

    if( userId == req.params.id ) {
        Sauce.findOne({_id: req.params.id})
            .then(sauce => {
                const filename = sauce.imageUrl.split('/images/')[1];
                fs.unlink(`images/${filename}`, () => {
                    Sauce.deleteOne({_id: req.params.id})
                        .then(() => res.status(200).json({message: 'Objet supprimé !'}))
                        .catch(error => res.status(400).json({error}));
                });
            })
            .catch(error => res.status(500).json({error}));
    }
    else{
        res.status(401).send('You are not authenticated to delete this sauce')
    }
};

exports.getAllSauce = (req, res, next) => {
    Sauce.find().then(
        (sauces) => {
            res.status(200).json(sauces);
        }
    ).catch(
        (error) => {
            res.status(400).json({
                error: error
            });
        }
    );
};

exports.likeSauce = (req, res, next) => {
    const sauceId = req.params.id;
    const userId = req.body.userId;
    const like = req.body.like;

    switch (like) {
        case 1:
            Sauce.updateOne(
                {_id: sauceId},
                {
                    $inc: {likes: 1},
                    $push: {usersLiked: userId},
                }
            )
                .then((sauce) => res.status(200).json({message: "Sauce likée"}))
                .catch((error) => res.status(500).json({error}));
            break;
        case -1:
            Sauce.updateOne(
                {_id: sauceId},
                {
                    $inc: {dislikes: 1},
                    $push: {usersDisliked: userId},
                }
            )
                .then((sauce) => res.status(200).json({message: "Sauce dislikée"}))
                .catch((error) => res.status(500).json({error}));
            break;
        case 0:
            Sauce.findOne({_id: sauceId})
                .then((sauce) => {
                    if (sauce.usersLiked.includes(userId)) {
                        Sauce.updateOne(
                            {_id: sauceId},
                            {$pull: {usersLiked: userId}, $inc: {likes: -1}}
                        )
                            .then((sauce) => {
                                res.status(200).json({message: "Sauce dislikée"});
                            })
                            .catch((error) => res.status(500).json({error}));
                        // 3.2 user is changing his mind on his dislike
                    } else if (sauce.usersDisliked.includes(userId)) {
                        Sauce.updateOne(
                            {_id: sauceId},
                            {
                                $pull: {usersDisliked: userId},
                                $inc: {dislikes: -1},
                            }
                        )
                            .then((sauce) => {
                                res.status(200).json({message: "Sauce likée"});
                            })
                            .catch((error) => res.status(500).json({error}));
                    }
                })
                .catch((error) => res.status(401).json({error}));
    }
}
