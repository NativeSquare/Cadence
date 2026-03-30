/* eslint-disable */
/**
 * Generated `ComponentApi` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type { FunctionReference } from "convex/server";

/**
 * A utility for referencing a Convex component's exposed API.
 *
 * Useful when expecting a parameter like `components.myComponent`.
 * Usage:
 * ```ts
 * async function myFunction(ctx: QueryCtx, component: ComponentApi) {
 *   return ctx.runQuery(component.someFile.someQuery, { ...args });
 * }
 * ```
 */
export type ComponentApi<Name extends string | undefined = string | undefined> =
  {
    garmin: {
      completeGarminOAuth: FunctionReference<
        "action",
        "internal",
        {
          clientId: string;
          clientSecret: string;
          code: string;
          redirectUri?: string;
          state: string;
        },
        {
          connectionId: string;
          errors: Array<{ error: string; id: string; type: string }>;
          synced: {
            activities: number;
            bloodPressures: number;
            body: number;
            dailies: number;
            hrv: number;
            menstruation: number;
            pulseOx: number;
            respiration: number;
            skinTemp: number;
            sleep: number;
            stressDetails: number;
            userMetrics: number;
          };
        },
        Name
      >;
      connectGarmin: FunctionReference<
        "action",
        "internal",
        {
          clientId: string;
          clientSecret: string;
          code: string;
          codeVerifier: string;
          redirectUri?: string;
          userId: string;
        },
        {
          connectionId: string;
          errors: Array<{ error: string; id: string; type: string }>;
          synced: {
            activities: number;
            bloodPressures: number;
            body: number;
            dailies: number;
            hrv: number;
            menstruation: number;
            pulseOx: number;
            respiration: number;
            skinTemp: number;
            sleep: number;
            stressDetails: number;
            userMetrics: number;
          };
        },
        Name
      >;
      disconnectGarmin: FunctionReference<
        "action",
        "internal",
        { userId: string },
        null,
        Name
      >;
      getGarminAuthUrl: FunctionReference<
        "action",
        "internal",
        { clientId: string; redirectUri?: string; userId?: string },
        { authUrl: string; codeVerifier: string; state: string },
        Name
      >;
      handleGarminWebhookActivities: FunctionReference<
        "action",
        "internal",
        { payload: any },
        {
          errors: Array<{ error: string; id: string; type: string }>;
          processed: number;
        },
        Name
      >;
      handleGarminWebhookBloodPressures: FunctionReference<
        "action",
        "internal",
        { payload: any },
        {
          errors: Array<{ error: string; id: string; type: string }>;
          processed: number;
        },
        Name
      >;
      handleGarminWebhookBody: FunctionReference<
        "action",
        "internal",
        { payload: any },
        {
          errors: Array<{ error: string; id: string; type: string }>;
          processed: number;
        },
        Name
      >;
      handleGarminWebhookDailies: FunctionReference<
        "action",
        "internal",
        { payload: any },
        {
          errors: Array<{ error: string; id: string; type: string }>;
          processed: number;
        },
        Name
      >;
      handleGarminWebhookHRV: FunctionReference<
        "action",
        "internal",
        { payload: any },
        {
          errors: Array<{ error: string; id: string; type: string }>;
          processed: number;
        },
        Name
      >;
      handleGarminWebhookMenstruation: FunctionReference<
        "action",
        "internal",
        { payload: any },
        {
          errors: Array<{ error: string; id: string; type: string }>;
          processed: number;
        },
        Name
      >;
      handleGarminWebhookPulseOx: FunctionReference<
        "action",
        "internal",
        { payload: any },
        {
          errors: Array<{ error: string; id: string; type: string }>;
          processed: number;
        },
        Name
      >;
      handleGarminWebhookRespiration: FunctionReference<
        "action",
        "internal",
        { payload: any },
        {
          errors: Array<{ error: string; id: string; type: string }>;
          processed: number;
        },
        Name
      >;
      handleGarminWebhookSkinTemp: FunctionReference<
        "action",
        "internal",
        { payload: any },
        {
          errors: Array<{ error: string; id: string; type: string }>;
          processed: number;
        },
        Name
      >;
      handleGarminWebhookSleeps: FunctionReference<
        "action",
        "internal",
        { payload: any },
        {
          errors: Array<{ error: string; id: string; type: string }>;
          processed: number;
        },
        Name
      >;
      handleGarminWebhookStressDetails: FunctionReference<
        "action",
        "internal",
        { payload: any },
        {
          errors: Array<{ error: string; id: string; type: string }>;
          processed: number;
        },
        Name
      >;
      handleGarminWebhookUserMetrics: FunctionReference<
        "action",
        "internal",
        { payload: any },
        {
          errors: Array<{ error: string; id: string; type: string }>;
          processed: number;
        },
        Name
      >;
      pushPlannedWorkout: FunctionReference<
        "action",
        "internal",
        {
          clientId: string;
          clientSecret: string;
          plannedWorkoutId: string;
          userId: string;
          workoutProvider?: string;
        },
        { garminScheduleId: number | null; garminWorkoutId: number },
        Name
      >;
      syncGarmin: FunctionReference<
        "action",
        "internal",
        {
          clientId: string;
          clientSecret: string;
          endTimeInSeconds?: number;
          startTimeInSeconds?: number;
          userId: string;
        },
        {
          errors: Array<{ error: string; id: string; type: string }>;
          synced: {
            activities: number;
            bloodPressures: number;
            body: number;
            dailies: number;
            hrv: number;
            menstruation: number;
            pulseOx: number;
            respiration: number;
            skinTemp: number;
            sleep: number;
            stressDetails: number;
            userMetrics: number;
          };
        },
        Name
      >;
    };
    public: {
      connect: FunctionReference<
        "mutation",
        "internal",
        { provider: string; providerUserId?: string; userId: string },
        string,
        Name
      >;
      deleteConnection: FunctionReference<
        "mutation",
        "internal",
        { connectionId: string },
        null,
        Name
      >;
      deletePlannedWorkout: FunctionReference<
        "mutation",
        "internal",
        { plannedWorkoutId: string },
        null,
        Name
      >;
      disconnect: FunctionReference<
        "mutation",
        "internal",
        { provider: string; userId: string },
        null,
        Name
      >;
      getAthlete: FunctionReference<
        "query",
        "internal",
        { connectionId: string },
        any,
        Name
      >;
      getConnection: FunctionReference<
        "query",
        "internal",
        { connectionId: string },
        null | {
          _creationTime: number;
          _id: string;
          active?: boolean;
          lastDataUpdate?: string;
          provider: string;
          providerUserId?: string;
          userId: string;
        },
        Name
      >;
      getConnectionByProvider: FunctionReference<
        "query",
        "internal",
        { provider: string; userId: string },
        null | {
          _creationTime: number;
          _id: string;
          active?: boolean;
          lastDataUpdate?: string;
          provider: string;
          providerUserId?: string;
          userId: string;
        },
        Name
      >;
      getPlannedWorkout: FunctionReference<
        "query",
        "internal",
        { plannedWorkoutId: string },
        any,
        Name
      >;
      ingestActivity: FunctionReference<
        "mutation",
        "internal",
        {
          MET_data?: {
            MET_samples?: Array<{ level?: number; timestamp?: string }>;
            avg_level?: number;
            num_high_intensity_minutes?: number;
            num_inactive_minutes?: number;
            num_low_intensity_minutes?: number;
            num_moderate_intensity_minutes?: number;
          };
          TSS_data?: {
            TSS_samples?: Array<{
              actual?: number;
              intensity_factor_actual?: number;
              intensity_factor_planned?: number;
              method?: string;
              normalized_power_watts?: number;
              planned?: number;
            }>;
          };
          active_durations_data?: {
            activity_levels_samples?: Array<{
              level?: number;
              timestamp?: string;
            }>;
            activity_seconds?: number;
            inactivity_seconds?: number;
            low_intensity_seconds?: number;
            moderate_intensity_seconds?: number;
            num_continuous_inactive_periods?: number;
            rest_seconds?: number;
            standing_hours_count?: number;
            standing_seconds?: number;
            vigorous_intensity_seconds?: number;
          };
          calories_data?: {
            BMR_calories?: number;
            calorie_samples?: Array<{
              calories?: number;
              timer_duration_seconds?: number;
              timestamp?: string;
            }>;
            net_activity_calories?: number;
            net_intake_calories?: number;
            total_burned_calories?: number;
          };
          cheat_detection?: number;
          connectionId: string;
          data_enrichment?: { stress_score?: number };
          device_data?: {
            activation_timestamp?: string;
            data_provided?: Array<string>;
            hardware_version?: string;
            last_upload_date?: string;
            manufacturer?: string;
            name?: string;
            other_devices?: Array<{
              activation_timestamp?: string;
              data_provided?: Array<string>;
              hardware_version?: string;
              last_upload_date?: string;
              manufacturer?: string;
              name?: string;
              serial_number?: string;
              software_version?: string;
            }>;
            sensor_state?: string;
            serial_number?: string;
            software_version?: string;
          };
          distance_data?: {
            detailed?: {
              distance_samples?: Array<{
                distance_meters?: number;
                timer_duration_seconds?: number;
                timestamp?: string;
              }>;
              elevation_samples?: Array<{
                elev_meters?: number;
                timer_duration_seconds?: number;
                timestamp?: string;
              }>;
              floors_climbed_samples?: Array<{
                floors_climbed?: number;
                timer_duration_seconds?: number;
                timestamp?: string;
              }>;
              step_samples?: Array<{
                steps?: number;
                timer_duration_seconds?: number;
                timestamp?: string;
              }>;
            };
            summary?: {
              distance_meters?: number;
              elevation?: {
                avg_meters?: number;
                gain_actual_meters?: number;
                gain_planned_meters?: number;
                loss_actual_meters?: number;
                max_meters?: number;
                min_meters?: number;
              };
              floors_climbed?: number;
              steps?: number;
              swimming?: {
                num_laps?: number;
                num_strokes?: number;
                pool_length_meters?: number;
              };
            };
          };
          energy_data?: {
            energy_kilojoules?: number;
            energy_planned_kilojoules?: number;
          };
          heart_rate_data?: {
            detailed?: {
              hr_samples?: Array<{
                bpm?: number;
                context?: number;
                timer_duration_seconds?: number;
                timestamp?: string;
              }>;
              hrv_samples_rmssd?: Array<{
                hrv_rmssd?: number;
                timestamp?: string;
              }>;
              hrv_samples_sdnn?: Array<{
                hrv_sdnn?: number;
                timestamp?: string;
              }>;
            };
            summary?: {
              avg_hr_bpm?: number;
              avg_hrv_rmssd?: number;
              avg_hrv_sdnn?: number;
              hr_zone_data?: Array<{
                duration_seconds?: number;
                end_percentage?: number;
                name?: string;
                start_percentage?: number;
                zone?: number;
              }>;
              max_hr_bpm?: number;
              min_hr_bpm?: number;
              resting_hr_bpm?: number;
              user_max_hr_bpm?: number;
            };
          };
          lap_data?: {
            laps?: Array<{
              avg_hr_bpm?: number;
              avg_speed_meters_per_second?: number;
              calories?: number;
              distance_meters?: number;
              end_time?: string;
              start_time?: string;
              stroke_type?: string;
              total_strokes?: number;
            }>;
          };
          metadata: {
            city?: string;
            country?: string;
            end_time: string;
            name?: string;
            start_time: string;
            state?: string;
            summary_id: string;
            timestamp_localization?: number;
            type: number;
            upload_type: number;
          };
          movement_data?: {
            adjusted_max_speed_meters_per_second?: number;
            avg_cadence_rpm?: number;
            avg_pace_minutes_per_kilometer?: number;
            avg_speed_meters_per_second?: number;
            avg_torque_newton_meters?: number;
            avg_velocity_meters_per_second?: number;
            cadence_samples?: Array<{
              cadence_rpm?: number;
              timer_duration_seconds?: number;
              timestamp?: string;
            }>;
            max_cadence_rpm?: number;
            max_pace_minutes_per_kilometer?: number;
            max_speed_meters_per_second?: number;
            max_torque_newton_meters?: number;
            max_velocity_meters_per_second?: number;
            normalized_speed_meters_per_second?: number;
            speed_samples?: Array<{
              speed_meters_per_second?: number;
              timer_duration_seconds?: number;
              timestamp?: string;
            }>;
            torque_samples?: Array<{
              timer_duration_seconds?: number;
              timestamp?: string;
              torque_newton_meters?: number;
            }>;
          };
          oxygen_data?: {
            avg_saturation_percentage?: number;
            saturation_samples?: Array<{
              percentage?: number;
              timestamp?: string;
              type?: number;
            }>;
            vo2_samples?: Array<{
              timestamp?: string;
              vo2max_ml_per_min_per_kg?: number;
            }>;
            vo2max_ml_per_min_per_kg?: number;
          };
          polyline_map_data?: { summary_polyline?: string };
          position_data?: {
            center_pos_lat_lng_deg?: Array<number>;
            end_pos_lat_lng_deg?: Array<number>;
            position_samples?: Array<{
              coords_lat_lng_deg?: Array<number>;
              timer_duration_seconds?: number;
              timestamp?: string;
            }>;
            start_pos_lat_lng_deg?: Array<number>;
          };
          power_data?: {
            avg_watts?: number;
            max_watts?: number;
            power_samples?: Array<{
              timer_duration_seconds?: number;
              timestamp?: string;
              watts?: number;
            }>;
          };
          strain_data?: { strain_level?: number };
          userId: string;
          work_data?: { work_kilojoules?: number };
        },
        string,
        Name
      >;
      ingestAthlete: FunctionReference<
        "mutation",
        "internal",
        {
          age?: number;
          bio?: string;
          city?: string;
          connectionId: string;
          country?: string;
          date_of_birth?: string;
          devices?: Array<any>;
          email?: string;
          first_name?: string;
          gender?: string;
          joined_provider?: string;
          last_name?: string;
          sex?: string;
          state?: string;
          userId: string;
        },
        string,
        Name
      >;
      ingestBody: FunctionReference<
        "mutation",
        "internal",
        {
          blood_pressure_data?: {
            blood_pressure_samples?: Array<{
              diastolic_bp?: number;
              systolic_bp?: number;
              timestamp?: string;
            }>;
          };
          connectionId: string;
          device_data?: {
            activation_timestamp?: string;
            data_provided?: Array<string>;
            hardware_version?: string;
            last_upload_date?: string;
            manufacturer?: string;
            name?: string;
            other_devices?: Array<{
              activation_timestamp?: string;
              data_provided?: Array<string>;
              hardware_version?: string;
              last_upload_date?: string;
              manufacturer?: string;
              name?: string;
              serial_number?: string;
              software_version?: string;
            }>;
            sensor_state?: string;
            serial_number?: string;
            software_version?: string;
          };
          glucose_data?: {
            blood_glucose_samples?: Array<{
              blood_glucose_mg_per_dL?: number;
              glucose_level_flag?: number;
              timestamp?: string;
              trend_arrow?: number;
            }>;
            daily_patterns?: Array<{
              percentile_25?: number;
              percentile_5?: number;
              percentile_50?: number;
              percentile_75?: number;
              percentile_95?: number;
              time_from_midnight?: number;
            }>;
            day_avg_blood_glucose_mg_per_dL?: number;
            detailed_blood_glucose_samples?: Array<{
              blood_glucose_mg_per_dL?: number;
              glucose_level_flag?: number;
              timestamp?: string;
              trend_arrow?: number;
            }>;
            gmi?: number;
            sensor_usage?: number;
            time_in_range?: number;
          };
          heart_data?: {
            afib_classification_samples?: Array<{
              afib_classification?: number;
              timestamp?: string;
            }>;
            ecg_signal?: Array<{
              afib_classification?: number;
              avg_hr_bpm?: number;
              raw_signal?: Array<{ potential_uV?: number; timestamp?: string }>;
              start_timestamp?: string;
            }>;
            heart_rate_data?: {
              detailed?: {
                hr_samples?: Array<{
                  bpm?: number;
                  context?: number;
                  timer_duration_seconds?: number;
                  timestamp?: string;
                }>;
                hrv_samples_rmssd?: Array<{
                  hrv_rmssd?: number;
                  timestamp?: string;
                }>;
                hrv_samples_sdnn?: Array<{
                  hrv_sdnn?: number;
                  timestamp?: string;
                }>;
              };
              summary?: {
                avg_hr_bpm?: number;
                avg_hrv_rmssd?: number;
                avg_hrv_sdnn?: number;
                hr_zone_data?: Array<{
                  duration_seconds?: number;
                  end_percentage?: number;
                  name?: string;
                  start_percentage?: number;
                  zone?: number;
                }>;
                max_hr_bpm?: number;
                min_hr_bpm?: number;
                resting_hr_bpm?: number;
                user_max_hr_bpm?: number;
              };
            };
            pulse_wave_velocity_samples?: Array<{
              pulse_wave_velocity_meters_per_second?: number;
              timestamp?: string;
            }>;
            rr_interval_samples?: Array<{
              hr_bpm?: number;
              rr_interval_ms?: number;
              timestamp?: string;
            }>;
          };
          hydration_data?: {
            day_total_water_consumption_ml?: number;
            hydration_amount_samples?: Array<{
              hydration_kg?: number;
              timestamp?: string;
            }>;
          };
          ketone_data?: {
            ketone_samples?: Array<{
              ketone_mg_per_dL?: number;
              sample_type?: number;
              timestamp?: string;
            }>;
          };
          measurements_data?: {
            measurements?: Array<{
              BMI?: number;
              BMR?: number;
              RMR?: number;
              bodyfat_percentage?: number;
              bone_mass_g?: number;
              estimated_fitness_age?: string;
              height_cm?: number;
              insulin_type?: string;
              insulin_units?: number;
              lean_mass_g?: number;
              measurement_time?: string;
              muscle_mass_g?: number;
              skin_fold_mm?: number;
              urine_color?: string;
              user_notes?: string;
              water_percentage?: number;
              weight_kg?: number;
            }>;
          };
          metadata: {
            end_time: string;
            start_time: string;
            timestamp_localization?: number;
          };
          oxygen_data?: {
            avg_saturation_percentage?: number;
            saturation_samples?: Array<{
              percentage?: number;
              timestamp?: string;
              type?: number;
            }>;
            vo2_samples?: Array<{
              timestamp?: string;
              vo2max_ml_per_min_per_kg?: number;
            }>;
            vo2max_ml_per_min_per_kg?: number;
          };
          temperature_data?: {
            ambient_temperature_samples?: Array<{
              temperature_celsius?: number;
              timestamp?: string;
            }>;
            body_temperature_samples?: Array<{
              temperature_celsius?: number;
              timestamp?: string;
            }>;
            skin_temperature_samples?: Array<{
              temperature_celsius?: number;
              timestamp?: string;
            }>;
          };
          userId: string;
        },
        string,
        Name
      >;
      ingestDaily: FunctionReference<
        "mutation",
        "internal",
        {
          MET_data?: {
            MET_samples?: Array<{ level?: number; timestamp?: string }>;
            avg_level?: number;
            num_high_intensity_minutes?: number;
            num_inactive_minutes?: number;
            num_low_intensity_minutes?: number;
            num_moderate_intensity_minutes?: number;
          };
          active_durations_data?: {
            activity_levels_samples?: Array<{
              level?: number;
              timestamp?: string;
            }>;
            activity_seconds?: number;
            inactivity_seconds?: number;
            low_intensity_seconds?: number;
            moderate_intensity_seconds?: number;
            num_continuous_inactive_periods?: number;
            rest_seconds?: number;
            standing_hours_count?: number;
            standing_seconds?: number;
            vigorous_intensity_seconds?: number;
          };
          calories_data?: {
            BMR_calories?: number;
            calorie_samples?: Array<{
              calories?: number;
              timer_duration_seconds?: number;
              timestamp?: string;
            }>;
            net_activity_calories?: number;
            net_intake_calories?: number;
            total_burned_calories?: number;
          };
          connectionId: string;
          data_enrichment?: {
            cardiovascular_contributors?: Array<{
              contributor_name: string;
              contributor_score: number;
            }>;
            cardiovascular_score?: number;
            immune_contributors?: Array<{
              contributor_name: string;
              contributor_score: number;
            }>;
            immune_index?: number;
            readiness_contributors?: Array<{
              contributor_name: string;
              contributor_score: number;
            }>;
            readiness_score?: number;
            respiratory_contributors?: Array<{
              contributor_name: string;
              contributor_score: number;
            }>;
            respiratory_score?: number;
            start_time?: string;
            stress_contributors?: Array<{
              contributor_name: string;
              contributor_score: number;
            }>;
            total_stress_score?: number;
          };
          device_data?: {
            activation_timestamp?: string;
            data_provided?: Array<string>;
            hardware_version?: string;
            last_upload_date?: string;
            manufacturer?: string;
            name?: string;
            other_devices?: Array<{
              activation_timestamp?: string;
              data_provided?: Array<string>;
              hardware_version?: string;
              last_upload_date?: string;
              manufacturer?: string;
              name?: string;
              serial_number?: string;
              software_version?: string;
            }>;
            sensor_state?: string;
            serial_number?: string;
            software_version?: string;
          };
          distance_data?: {
            detailed?: {
              distance_samples?: Array<{
                distance_meters?: number;
                timer_duration_seconds?: number;
                timestamp?: string;
              }>;
              elevation_samples?: Array<{
                elev_meters?: number;
                timer_duration_seconds?: number;
                timestamp?: string;
              }>;
              floors_climbed_samples?: Array<{
                floors_climbed?: number;
                timer_duration_seconds?: number;
                timestamp?: string;
              }>;
              step_samples?: Array<{
                steps?: number;
                timer_duration_seconds?: number;
                timestamp?: string;
              }>;
            };
            distance_meters?: number;
            elevation?: {
              avg_meters?: number;
              gain_actual_meters?: number;
              gain_planned_meters?: number;
              loss_actual_meters?: number;
              max_meters?: number;
              min_meters?: number;
            };
            floors_climbed?: number;
            steps?: number;
            swimming?: {
              num_laps?: number;
              num_strokes?: number;
              pool_length_meters?: number;
            };
          };
          heart_rate_data?: {
            detailed?: {
              hr_samples?: Array<{
                bpm?: number;
                context?: number;
                timer_duration_seconds?: number;
                timestamp?: string;
              }>;
              hrv_samples_rmssd?: Array<{
                hrv_rmssd?: number;
                timestamp?: string;
              }>;
              hrv_samples_sdnn?: Array<{
                hrv_sdnn?: number;
                timestamp?: string;
              }>;
            };
            summary?: {
              avg_hr_bpm?: number;
              avg_hrv_rmssd?: number;
              avg_hrv_sdnn?: number;
              hr_zone_data?: Array<{
                duration_seconds?: number;
                end_percentage?: number;
                name?: string;
                start_percentage?: number;
                zone?: number;
              }>;
              max_hr_bpm?: number;
              min_hr_bpm?: number;
              resting_hr_bpm?: number;
              user_max_hr_bpm?: number;
            };
          };
          metadata: {
            end_time: string;
            start_time: string;
            timestamp_localization?: number;
            upload_type: number;
          };
          oxygen_data?: {
            avg_saturation_percentage?: number;
            saturation_samples?: Array<{
              percentage?: number;
              timestamp?: string;
              type?: number;
            }>;
            vo2_samples?: Array<{
              timestamp?: string;
              vo2max_ml_per_min_per_kg?: number;
            }>;
            vo2max_ml_per_min_per_kg?: number;
          };
          respiration_data?: {
            breaths_data?: {
              avg_breaths_per_min?: number;
              max_breaths_per_min?: number;
              min_breaths_per_min?: number;
              samples?: Array<{ breaths_per_min?: number; timestamp?: string }>;
            };
          };
          scores?: {
            activity?: number;
            biological_age?: number;
            recovery?: number;
            sleep?: number;
          };
          strain_data?: { strain_level?: number };
          stress_data?: {
            activity_stress_duration_seconds?: number;
            avg_stress_level?: number;
            body_battery_samples?: Array<{
              level?: number;
              timestamp?: string;
            }>;
            high_stress_duration_seconds?: number;
            low_stress_duration_seconds?: number;
            max_stress_level?: number;
            medium_stress_duration_seconds?: number;
            rest_stress_duration_seconds?: number;
            samples?: Array<{ level?: number; timestamp?: string }>;
            stress_duration_seconds?: number;
            stress_rating?: number;
          };
          tag_data?: {
            tags?: Array<{
              notes: string;
              tag_name: string;
              timestamp: string;
            }>;
          };
          userId: string;
        },
        string,
        Name
      >;
      ingestMenstruation: FunctionReference<
        "mutation",
        "internal",
        {
          connectionId: string;
          menstruation_data?: {
            current_phase?: string;
            cycle_length_days?: string;
            day_in_cycle?: number;
            days_until_next_phase?: number;
            is_predicted_cycle?: string;
            last_updated_time?: string;
            length_of_current_phase_days?: number;
            menstruation_flow?: Array<{ flow?: number; timestamp?: string }>;
            period_length_days?: number;
            period_start_date?: string;
            predicted_cycle_length_days?: number;
          };
          metadata: {
            end_time: string;
            start_time: string;
            timestamp_localization?: number;
          };
          userId: string;
        },
        string,
        Name
      >;
      ingestNutrition: FunctionReference<
        "mutation",
        "internal",
        {
          connectionId: string;
          drink_samples?: Array<{
            drink_name?: string;
            drink_unit?: string;
            drink_volume?: number;
            timestamp?: string;
          }>;
          meals?: Array<{
            id: string;
            macros: {
              alcohol_g?: number;
              calories?: number;
              carbohydrates_g?: number;
              cholesterol_mg?: number;
              fat_g?: number;
              fiber_g?: number;
              net_carbohydrates_g?: number;
              protein_g?: number;
              saturated_fat_g?: number;
              sodium_mg?: number;
              sugar_g?: number;
              trans_fat_g?: number;
            };
            micros: {
              biotin_mg?: number;
              caffeine_mg?: number;
              calcium_mg?: number;
              chloride_mg?: number;
              chromium_mg?: number;
              copper_mg?: number;
              cystine_g?: number;
              folate_mg?: number;
              folic_acid_mg?: number;
              histidine_g?: number;
              iodine_mg?: number;
              iron_mg?: number;
              isoleucine_g?: number;
              leucine_g?: number;
              lysine_g?: number;
              magnesium_mg?: number;
              manganese_mg?: number;
              methionine_g?: number;
              molybdenum_mg?: number;
              monounsaturated_fat_g?: number;
              niacin_mg?: number;
              omega3_g?: number;
              omega6_g?: number;
              pantothenic_acid_mg?: number;
              phenylalanine_g?: number;
              phosphorus_mg?: number;
              polyunsaturated_fat_g?: number;
              potassium_mg?: number;
              riboflavin_mg?: number;
              selenium_mg?: number;
              starch_g?: number;
              thiamin_mg?: number;
              threonine_g?: number;
              tryptophan_g?: number;
              tyrosine_g?: number;
              valine_g?: number;
              vitamin_A_mg?: number;
              vitamin_B12_mg?: number;
              vitamin_B6_mg?: number;
              vitamin_C_mg?: number;
              vitamin_D2_mg?: number;
              vitamin_D3_mg?: number;
              vitamin_D_mg?: number;
              vitamin_E_mg?: number;
              vitamin_K_mg?: number;
              zinc_mg?: number;
            };
            name: string;
            quantity: { amount: number; unit: number };
            timestamp: string;
            type: number;
          }>;
          metadata: {
            end_time: string;
            start_time: string;
            timestamp_localization?: number;
          };
          summary?: {
            drink_ml?: number;
            macros?: {
              alcohol_g?: number;
              calories?: number;
              carbohydrates_g?: number;
              cholesterol_mg?: number;
              fat_g?: number;
              fiber_g?: number;
              net_carbohydrates_g?: number;
              protein_g?: number;
              saturated_fat_g?: number;
              sodium_mg?: number;
              sugar_g?: number;
              trans_fat_g?: number;
            };
            micros?: {
              biotin_mg?: number;
              caffeine_mg?: number;
              calcium_mg?: number;
              chloride_mg?: number;
              chromium_mg?: number;
              copper_mg?: number;
              cystine_g?: number;
              folate_mg?: number;
              folic_acid_mg?: number;
              histidine_g?: number;
              iodine_mg?: number;
              iron_mg?: number;
              isoleucine_g?: number;
              leucine_g?: number;
              lysine_g?: number;
              magnesium_mg?: number;
              manganese_mg?: number;
              methionine_g?: number;
              molybdenum_mg?: number;
              monounsaturated_fat_g?: number;
              niacin_mg?: number;
              omega3_g?: number;
              omega6_g?: number;
              pantothenic_acid_mg?: number;
              phenylalanine_g?: number;
              phosphorus_mg?: number;
              polyunsaturated_fat_g?: number;
              potassium_mg?: number;
              riboflavin_mg?: number;
              selenium_mg?: number;
              starch_g?: number;
              thiamin_mg?: number;
              threonine_g?: number;
              tryptophan_g?: number;
              tyrosine_g?: number;
              valine_g?: number;
              vitamin_A_mg?: number;
              vitamin_B12_mg?: number;
              vitamin_B6_mg?: number;
              vitamin_C_mg?: number;
              vitamin_D2_mg?: number;
              vitamin_D3_mg?: number;
              vitamin_D_mg?: number;
              vitamin_E_mg?: number;
              vitamin_K_mg?: number;
              zinc_mg?: number;
            };
            water_ml?: number;
          };
          userId: string;
        },
        string,
        Name
      >;
      ingestPlannedWorkout: FunctionReference<
        "mutation",
        "internal",
        {
          connectionId: string;
          metadata: {
            created_date?: string;
            description?: string;
            estimated_calories?: number;
            estimated_distance_meters?: number;
            estimated_duration_seconds?: number;
            estimated_elevation_gain_meters?: number;
            estimated_energy_kj?: number;
            estimated_if?: number;
            estimated_pace_minutes_per_kilometer?: number;
            estimated_speed_meters_per_second?: number;
            estimated_tscore?: number;
            estimated_tss?: number;
            id?: string;
            name?: string;
            planned_date?: string;
            pool_length_meters?: number;
            provider?: string;
            provider_schedule_id?: string;
            provider_workout_id?: string;
            type?: string;
          };
          steps?: Array<{
            description?: string;
            durations?: Array<{
              calories?: number;
              distance_meters?: number;
              duration_type?: string;
              hr_above_bpm?: number;
              hr_below_bpm?: number;
              power_above_watts?: number;
              power_below_watts?: number;
              reps?: number;
              rest_seconds?: number;
              seconds?: number;
              steps?: number;
            }>;
            equipment_type?: string;
            exercise_category?: string;
            exercise_name?: string;
            intensity?: string | number;
            name?: string;
            order?: number;
            steps?: Array<any>;
            stroke_type?: string;
            targets?: Array<{
              cadence?: number;
              cadence_high?: number;
              cadence_low?: number;
              hr_bpm_high?: number;
              hr_bpm_low?: number;
              hr_percentage?: number;
              hr_percentage_high?: number;
              hr_percentage_low?: number;
              if_high?: number;
              if_low?: number;
              pace_minutes_per_kilometer?: number;
              power_percentage?: number;
              power_percentage_high?: number;
              power_percentage_low?: number;
              power_watt?: number;
              power_watt_high?: number;
              power_watt_low?: number;
              repetitions?: number;
              speed_meters_per_second?: number;
              speed_percentage?: number;
              speed_percentage_high?: number;
              speed_percentage_low?: number;
              swim_strokes?: number;
              target_type?: string;
              tss?: number;
            }>;
            type?: string;
            weight_kg?: number;
          }>;
          userId: string;
        },
        string,
        Name
      >;
      ingestSleep: FunctionReference<
        "mutation",
        "internal",
        {
          connectionId: string;
          data_enrichment?: {
            sleep_contributors?: Array<{
              contributor_name: string;
              contributor_score: number;
            }>;
            sleep_score?: number;
          };
          device_data?: {
            activation_timestamp?: string;
            data_provided?: Array<string>;
            hardware_version?: string;
            last_upload_date?: string;
            manufacturer?: string;
            name?: string;
            other_devices?: Array<{
              activation_timestamp?: string;
              data_provided?: Array<string>;
              hardware_version?: string;
              last_upload_date?: string;
              manufacturer?: string;
              name?: string;
              serial_number?: string;
              software_version?: string;
            }>;
            sensor_state?: string;
            serial_number?: string;
            software_version?: string;
          };
          heart_rate_data?: {
            detailed?: {
              hr_samples?: Array<{
                bpm?: number;
                context?: number;
                timer_duration_seconds?: number;
                timestamp?: string;
              }>;
              hrv_samples_rmssd?: Array<{
                hrv_rmssd?: number;
                timestamp?: string;
              }>;
              hrv_samples_sdnn?: Array<{
                hrv_sdnn?: number;
                timestamp?: string;
              }>;
            };
            summary?: {
              avg_hr_bpm?: number;
              avg_hrv_rmssd?: number;
              avg_hrv_sdnn?: number;
              hr_zone_data?: Array<{
                duration_seconds?: number;
                end_percentage?: number;
                name?: string;
                start_percentage?: number;
                zone?: number;
              }>;
              max_hr_bpm?: number;
              min_hr_bpm?: number;
              resting_hr_bpm?: number;
              user_max_hr_bpm?: number;
            };
          };
          metadata: {
            end_time: string;
            is_nap?: boolean;
            start_time: string;
            summary_id?: string;
            timestamp_localization?: number;
            upload_type: number;
          };
          readiness_data?: { readiness?: number; recovery_level?: number };
          respiration_data?: {
            breaths_data?: {
              avg_breaths_per_min?: number;
              end_time?: string;
              max_breaths_per_min?: number;
              min_breaths_per_min?: number;
              on_demand_reading?: boolean;
              samples?: Array<{ breaths_per_min?: number; timestamp?: string }>;
              start_time?: string;
            };
            oxygen_saturation_data?: {
              avg_saturation_percentage?: number;
              end_time?: string;
              samples?: Array<{
                percentage?: number;
                timestamp?: string;
                type?: number;
              }>;
              start_time?: string;
            };
            snoring_data?: {
              end_time?: string;
              num_snoring_events?: number;
              samples?: Array<{
                duration_seconds?: number;
                timestamp?: string;
              }>;
              start_time?: string;
              total_snoring_duration_seconds?: number;
            };
          };
          scores?: { sleep?: number };
          sleep_durations_data?: {
            asleep?: {
              duration_REM_sleep_state_seconds?: number;
              duration_asleep_state_seconds?: number;
              duration_deep_sleep_state_seconds?: number;
              duration_light_sleep_state_seconds?: number;
              num_REM_events?: number;
            };
            awake?: {
              duration_awake_state_seconds?: number;
              duration_long_interruption_seconds?: number;
              duration_short_interruption_seconds?: number;
              num_out_of_bed_events?: number;
              num_wakeup_events?: number;
              sleep_latency_seconds?: number;
              wake_up_latency_seconds?: number;
            };
            hypnogram_samples?: Array<{ level?: number; timestamp?: string }>;
            other?: {
              duration_in_bed_seconds?: number;
              duration_unmeasurable_sleep_seconds?: number;
            };
            sleep_efficiency?: number;
          };
          temperature_data?: { delta?: number };
          userId: string;
        },
        string,
        Name
      >;
      listActivities: FunctionReference<
        "query",
        "internal",
        {
          endTime?: string;
          limit?: number;
          order?: "asc" | "desc";
          startTime?: string;
          userId: string;
        },
        any,
        Name
      >;
      listAthletes: FunctionReference<
        "query",
        "internal",
        { userId: string },
        any,
        Name
      >;
      listBody: FunctionReference<
        "query",
        "internal",
        {
          endTime?: string;
          limit?: number;
          order?: "asc" | "desc";
          startTime?: string;
          userId: string;
        },
        any,
        Name
      >;
      listConnections: FunctionReference<
        "query",
        "internal",
        { userId: string },
        Array<{
          _creationTime: number;
          _id: string;
          active?: boolean;
          lastDataUpdate?: string;
          provider: string;
          providerUserId?: string;
          userId: string;
        }>,
        Name
      >;
      listDaily: FunctionReference<
        "query",
        "internal",
        {
          endTime?: string;
          limit?: number;
          order?: "asc" | "desc";
          startTime?: string;
          userId: string;
        },
        any,
        Name
      >;
      listMenstruation: FunctionReference<
        "query",
        "internal",
        {
          endTime?: string;
          limit?: number;
          order?: "asc" | "desc";
          startTime?: string;
          userId: string;
        },
        any,
        Name
      >;
      listNutrition: FunctionReference<
        "query",
        "internal",
        {
          endTime?: string;
          limit?: number;
          order?: "asc" | "desc";
          startTime?: string;
          userId: string;
        },
        any,
        Name
      >;
      listPlannedWorkouts: FunctionReference<
        "query",
        "internal",
        {
          endDate?: string;
          limit?: number;
          order?: "asc" | "desc";
          startDate?: string;
          userId: string;
        },
        any,
        Name
      >;
      listSleep: FunctionReference<
        "query",
        "internal",
        {
          endTime?: string;
          limit?: number;
          order?: "asc" | "desc";
          startTime?: string;
          userId: string;
        },
        any,
        Name
      >;
      paginateActivities: FunctionReference<
        "query",
        "internal",
        {
          endTime?: string;
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
          startTime?: string;
          userId: string;
        },
        any,
        Name
      >;
      paginateBody: FunctionReference<
        "query",
        "internal",
        {
          endTime?: string;
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
          startTime?: string;
          userId: string;
        },
        any,
        Name
      >;
      paginateDaily: FunctionReference<
        "query",
        "internal",
        {
          endTime?: string;
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
          startTime?: string;
          userId: string;
        },
        any,
        Name
      >;
      paginateMenstruation: FunctionReference<
        "query",
        "internal",
        {
          endTime?: string;
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
          startTime?: string;
          userId: string;
        },
        any,
        Name
      >;
      paginateNutrition: FunctionReference<
        "query",
        "internal",
        {
          endTime?: string;
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
          startTime?: string;
          userId: string;
        },
        any,
        Name
      >;
      paginatePlannedWorkouts: FunctionReference<
        "query",
        "internal",
        {
          endDate?: string;
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
          startDate?: string;
          userId: string;
        },
        any,
        Name
      >;
      paginateSleep: FunctionReference<
        "query",
        "internal",
        {
          endTime?: string;
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
          startTime?: string;
          userId: string;
        },
        any,
        Name
      >;
      updateConnection: FunctionReference<
        "mutation",
        "internal",
        {
          active?: boolean;
          connectionId: string;
          lastDataUpdate?: string;
          providerUserId?: string;
        },
        null,
        Name
      >;
    };
    strava: {
      connectStrava: FunctionReference<
        "action",
        "internal",
        {
          baseUrl?: string;
          clientId: string;
          clientSecret: string;
          code: string;
          includeStreams?: boolean;
          userId: string;
        },
        {
          connectionId: string;
          errors: Array<{ activityId: number; error: string }>;
          synced: number;
        },
        Name
      >;
      disconnectStrava: FunctionReference<
        "action",
        "internal",
        {
          baseUrl?: string;
          clientId: string;
          clientSecret: string;
          userId: string;
        },
        null,
        Name
      >;
      syncStrava: FunctionReference<
        "action",
        "internal",
        {
          after?: number;
          baseUrl?: string;
          clientId: string;
          clientSecret: string;
          includeStreams?: boolean;
          userId: string;
        },
        {
          errors: Array<{ activityId: number; error: string }>;
          synced: number;
        },
        Name
      >;
    };
  };
