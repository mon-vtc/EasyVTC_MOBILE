import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { AppIcon } from '../components/common/AppIcon';
import { Colors, Fonts, Spacing, Radius } from '../theme/colors';
import { LinearGradient } from 'expo-linear-gradient';

type Props = {
  navigation: any;
};

const sections = [
  {
    title: '1. Objet',
    content:
      "Les présentes Conditions Générales d'Utilisation (CGU) régissent l'utilisation de l'application de réservation VTC. En créant un compte, vous acceptez ces conditions dans leur intégralité.",
  },
  {
    title: '2. Services proposés',
    content:
      "Notre application permet la mise en relation entre clients et chauffeurs VTC pour des trajets planifiés ou immédiats. Les réservations sont validées manuellement par notre équipe de gestion.",
  },
  {
    title: '3. Inscription et compte',
    content:
      "L'inscription nécessite la fourniture d'informations exactes et à jour. Vous êtes responsable de la confidentialité de vos identifiants de connexion.",
  },
  {
    title: '4. Réservations et paiements',
    content:
      "Les tarifs sont communiqués avant validation de la réservation. Le paiement s'effectue directement auprès du chauffeur (espèces ou carte bancaire). Aucun paiement n'est traité via l'application.",
  },
  {
    title: '5. Annulation',
    content:
      "Les annulations doivent être effectuées au moins 2 heures avant l'heure prévue du voyage. Des frais d'annulation peuvent s'appliquer selon les conditions.",
  },
  {
    title: '6. Protection des données',
    content:
      "Vos données personnelles sont traitées conformément au RGPD. Vous bénéficiez d'un droit d'accès, de rectification et de suppression de vos données.",
  },
  {
    title: '7. Responsabilité',
    content:
      "Notre rôle se limite à la mise en relation. Les chauffeurs sont des professionnels indépendants responsables de leurs prestations.",
  },
  {
    title: '8. Modification des CGU',
    content:
      "Nous nous réservons le droit de modifier ces CGU à tout moment. Les utilisateurs seront informés des modifications importantes.",
  },
];

export default function TermsAndConditionsScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>

      <LinearGradient
        colors={[Colors.bordeaux, Colors.bordeauxLight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBtn}
        >
          <AppIcon
            name="arrow-back"
            size={24}
            color={Colors.white}
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Conditions Générales{'\n'}
          d'Utilisation
        </Text>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>
              {section.title}
            </Text>

            <Text style={styles.sectionContent}>
              {section.content}
            </Text>
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.updatedAt}>
            Dernière mise à jour : Janvier 2026
          </Text>
        </View>
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  header: {
    paddingTop: Platform.OS === 'ios'
      ? 60
      : Spacing.xl + 20,

    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,

    borderBottomLeftRadius: Radius.xl,
    borderBottomRightRadius: Radius.xl,
  },

  headerBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },

  headerTitle: {
    color: Colors.white,
    fontSize: 25,
    fontFamily: Fonts.bold, fontWeight: '800',
    lineHeight: 36,
    textAlign: 'center'
  },

  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },

  section: {
    marginBottom: Spacing.xl,
  },

  sectionTitle: {
    fontSize: Fonts.size.md,
    fontFamily: Fonts.bold, fontWeight: '700',
    color: Colors.bordeaux,
    marginBottom: Spacing.sm,
  },

  sectionContent: {
    fontSize: Fonts.size.md,
    lineHeight: 26,
    color: Colors.textSecondary,
  },

  footer: {
    marginTop: Spacing.md,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },

  updatedAt: {
    fontSize: Fonts.size.sm,
    color: Colors.textMuted,
  },
});